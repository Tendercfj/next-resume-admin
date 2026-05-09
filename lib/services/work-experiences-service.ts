import type { CurrentAdmin } from "@/lib/auth/session"
import {
  createWorkExperience,
  deleteWorkExperience,
  findWorkExperienceById,
  listWorkExperiences,
  updateWorkExperience,
  type WorkEmploymentType,
  type WorkExperienceRow,
  type WorkExperienceWriteInput,
} from "@/lib/dao/work-experiences-dao"
import {
  getResumeReferenceMap,
  getResumeReferences,
  hasDatabaseCode,
  normalizeDateInput,
  optionalText,
  parseSortOrder,
  parseTextList,
  toDateInputString,
  toIsoString,
  type ResumeReference,
  validateDateRange,
  validateOptionalDate,
  validateOptionalText,
  validateRequiredText,
} from "@/lib/services/admin-content-shared"
import {
  writeAuditLog,
  type RequestAuditContext,
} from "@/lib/services/admin-audit-service"

export const WORK_EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "freelance",
] as const

export type WorkExperience = {
  id: string
  resumeId: string
  resumeSlug: string
  resumeTitle: string
  resumeOwnerName: string
  resumeIsPublished: boolean
  company: string
  role: string
  location: string
  employmentType: WorkEmploymentType | ""
  startDate: string
  endDate: string
  isCurrent: boolean
  summary: string
  highlights: string[]
  sortOrder: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export type WorkExperienceInput = {
  resumeId: string
  company: string
  role: string
  location: string
  employmentType: string
  startDate: string
  endDate: string
  isCurrent: boolean
  summary: string
  highlightsText: string
  sortOrder: string
  isVisible: boolean
}

export type WorkExperienceFieldErrors = Partial<
  Record<keyof WorkExperienceInput, string>
>

export type WorkExperienceMutationResult =
  | {
      ok: true
      workExperience: WorkExperience
      message: string
    }
  | {
      ok: false
      message: string
      fieldErrors?: WorkExperienceFieldErrors
    }

export type DeleteWorkExperienceResult =
  | {
      ok: true
      message: string
    }
  | {
      ok: false
      message: string
    }

function rowToWorkExperience(row: WorkExperienceRow): WorkExperience {
  return {
    id: row.id,
    resumeId: row.resume_id,
    resumeSlug: row.resume_slug,
    resumeTitle: row.resume_title,
    resumeOwnerName: row.resume_owner_name,
    resumeIsPublished: row.resume_is_published,
    company: row.company,
    role: row.role,
    location: row.location ?? "",
    employmentType: row.employment_type ?? "",
    startDate: toDateInputString(row.start_date),
    endDate: toDateInputString(row.end_date),
    isCurrent: row.is_current,
    summary: row.summary ?? "",
    highlights: row.highlights ?? [],
    sortOrder: row.sort_order,
    isVisible: row.is_visible,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  }
}

function validateWorkExperienceInput(input: WorkExperienceInput) {
  const fieldErrors: WorkExperienceFieldErrors = {}

  validateRequiredText(fieldErrors, "resumeId", input.resumeId, "关联资料", 100)
  validateRequiredText(fieldErrors, "company", input.company, "公司名称", 160)
  validateRequiredText(fieldErrors, "role", input.role, "职位名称", 160)
  validateOptionalText(fieldErrors, "location", input.location, "工作地点", 120)
  validateOptionalText(fieldErrors, "summary", input.summary, "工作概述", 4000)
  validateOptionalDate(fieldErrors, "startDate", input.startDate, "开始日期")
  validateOptionalDate(fieldErrors, "endDate", input.endDate, "结束日期")
  validateDateRange(
    fieldErrors,
    "startDate",
    "endDate",
    input.startDate,
    input.endDate,
    "结束日期"
  )

  if (
    input.employmentType.trim() &&
    !WORK_EMPLOYMENT_TYPES.includes(
      input.employmentType.trim() as WorkEmploymentType
    )
  ) {
    fieldErrors.employmentType =
      "雇佣类型只能是 full_time、part_time、contract、internship 或 freelance"
  }

  if (input.isCurrent && input.endDate.trim()) {
    fieldErrors.endDate = "当前任职无需填写结束日期"
  }

  const highlights = parseTextList(
    fieldErrors,
    "highlightsText",
    input.highlightsText,
    "工作亮点",
    {
      maxItems: 16,
      maxItemLength: 240,
      maxTotalLength: 4000,
    }
  )
  const sortOrder = parseSortOrder(fieldErrors, "sortOrder", input.sortOrder)

  return {
    fieldErrors,
    highlights,
    sortOrder,
  }
}

function normalizeWorkExperienceInput(
  input: WorkExperienceInput,
  highlights: string[],
  sortOrder: number
): WorkExperienceWriteInput {
  const normalizedEmploymentType = input.employmentType.trim()

  return {
    resumeId: input.resumeId.trim(),
    company: input.company.trim(),
    role: input.role.trim(),
    location: optionalText(input.location),
    employmentType: normalizedEmploymentType
      ? (normalizedEmploymentType as WorkEmploymentType)
      : null,
    startDate: normalizeDateInput(input.startDate),
    endDate: input.isCurrent ? null : normalizeDateInput(input.endDate),
    isCurrent: input.isCurrent,
    summary: optionalText(input.summary),
    highlights,
    sortOrder,
    isVisible: input.isVisible,
  }
}

function workExperienceForeignKeyError(): WorkExperienceMutationResult {
  return {
    ok: false,
    message: "关联资料不存在，请刷新后重试",
    fieldErrors: {
      resumeId: "请选择有效的简历资料",
    },
  }
}

export { getResumeReferences, type ResumeReference }

export async function getWorkExperiences() {
  const rows = await listWorkExperiences()
  return rows.map(rowToWorkExperience)
}

export async function createManagedWorkExperience(
  input: WorkExperienceInput,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<WorkExperienceMutationResult> {
  const { fieldErrors, highlights, sortOrder } = validateWorkExperienceInput(input)

  if (highlights === null || sortOrder === null) {
    return {
      ok: false,
      message: "请检查工作经历表单",
      fieldErrors,
    }
  }

  const resumeMap = await getResumeReferenceMap()

  if (!resumeMap.has(input.resumeId.trim())) {
    fieldErrors.resumeId = "请选择有效的简历资料"
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "请检查工作经历表单",
      fieldErrors,
    }
  }

  try {
    const row = await createWorkExperience(
      normalizeWorkExperienceInput(input, highlights, sortOrder)
    )
    const workExperience = rowToWorkExperience(row)

    await writeAuditLog({
      adminUserId: admin.id,
      action: "work-experience.create",
      entityType: "work_experience",
      entityId: workExperience.id,
      metadata: {
        resume_slug: workExperience.resumeSlug,
        company: workExperience.company,
        role: workExperience.role,
        is_current: workExperience.isCurrent,
      },
      context,
    })

    return {
      ok: true,
      workExperience,
      message: `已创建工作经历「${workExperience.company} · ${workExperience.role}」`,
    }
  } catch (error) {
    if (hasDatabaseCode(error, "23503")) {
      return workExperienceForeignKeyError()
    }

    return {
      ok: false,
      message: "保存失败，请稍后重试",
    }
  }
}

export async function updateManagedWorkExperience(
  workExperienceId: string,
  input: WorkExperienceInput,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<WorkExperienceMutationResult> {
  const { fieldErrors, highlights, sortOrder } = validateWorkExperienceInput(input)

  if (highlights === null || sortOrder === null) {
    return {
      ok: false,
      message: "请检查工作经历表单",
      fieldErrors,
    }
  }

  const resumeMap = await getResumeReferenceMap()

  if (!resumeMap.has(input.resumeId.trim())) {
    fieldErrors.resumeId = "请选择有效的简历资料"
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "请检查工作经历表单",
      fieldErrors,
    }
  }

  try {
    const row = await updateWorkExperience(
      workExperienceId,
      normalizeWorkExperienceInput(input, highlights, sortOrder)
    )

    if (!row) {
      return {
        ok: false,
        message: "工作经历不存在或已被删除",
      }
    }

    const workExperience = rowToWorkExperience(row)

    await writeAuditLog({
      adminUserId: admin.id,
      action: "work-experience.update",
      entityType: "work_experience",
      entityId: workExperience.id,
      metadata: {
        resume_slug: workExperience.resumeSlug,
        company: workExperience.company,
        role: workExperience.role,
        is_current: workExperience.isCurrent,
      },
      context,
    })

    return {
      ok: true,
      workExperience,
      message: `已保存工作经历「${workExperience.company} · ${workExperience.role}」`,
    }
  } catch (error) {
    if (hasDatabaseCode(error, "23503")) {
      return workExperienceForeignKeyError()
    }

    return {
      ok: false,
      message: "保存失败，请稍后重试",
    }
  }
}

export async function deleteManagedWorkExperience(
  workExperienceId: string,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<DeleteWorkExperienceResult> {
  const workExperience = await findWorkExperienceById(workExperienceId)

  if (!workExperience) {
    return {
      ok: false,
      message: "工作经历不存在或已被删除",
    }
  }

  const deleted = await deleteWorkExperience(workExperienceId)

  if (!deleted) {
    return {
      ok: false,
      message: "工作经历不存在或已被删除",
    }
  }

  await writeAuditLog({
    adminUserId: admin.id,
    action: "work-experience.delete",
    entityType: "work_experience",
    entityId: workExperience.id,
    metadata: {
      resume_slug: workExperience.resume_slug,
      company: workExperience.company,
      role: workExperience.role,
    },
    context,
  })

  return {
    ok: true,
    message: `已删除工作经历「${workExperience.company} · ${workExperience.role}」`,
  }
}
