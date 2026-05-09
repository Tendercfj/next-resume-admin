import type { CurrentAdmin } from "@/lib/auth/session"
import {
  createEducationRecord,
  deleteEducationRecord,
  findEducationById,
  listEducation,
  updateEducationRecord,
  type EducationRow,
  type EducationWriteInput,
} from "@/lib/dao/education-dao"
import {
  getResumeReferenceMap,
  getResumeReferences,
  hasDatabaseCode,
  normalizeDateInput,
  optionalText,
  parseSortOrder,
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

export type EducationRecord = {
  id: string
  resumeId: string
  resumeSlug: string
  resumeTitle: string
  resumeOwnerName: string
  resumeIsPublished: boolean
  school: string
  degree: string
  major: string
  location: string
  startDate: string
  endDate: string
  description: string
  sortOrder: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export type EducationInput = {
  resumeId: string
  school: string
  degree: string
  major: string
  location: string
  startDate: string
  endDate: string
  description: string
  sortOrder: string
  isVisible: boolean
}

export type EducationFieldErrors = Partial<Record<keyof EducationInput, string>>

export type EducationMutationResult =
  | {
      ok: true
      education: EducationRecord
      message: string
    }
  | {
      ok: false
      message: string
      fieldErrors?: EducationFieldErrors
    }

export type DeleteEducationResult =
  | {
      ok: true
      message: string
    }
  | {
      ok: false
      message: string
    }

function rowToEducation(row: EducationRow): EducationRecord {
  return {
    id: row.id,
    resumeId: row.resume_id,
    resumeSlug: row.resume_slug,
    resumeTitle: row.resume_title,
    resumeOwnerName: row.resume_owner_name,
    resumeIsPublished: row.resume_is_published,
    school: row.school,
    degree: row.degree ?? "",
    major: row.major ?? "",
    location: row.location ?? "",
    startDate: toDateInputString(row.start_date),
    endDate: toDateInputString(row.end_date),
    description: row.description ?? "",
    sortOrder: row.sort_order,
    isVisible: row.is_visible,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  }
}

function validateEducationInput(input: EducationInput) {
  const fieldErrors: EducationFieldErrors = {}

  validateRequiredText(fieldErrors, "resumeId", input.resumeId, "关联资料", 100)
  validateRequiredText(fieldErrors, "school", input.school, "学校名称", 160)
  validateOptionalText(fieldErrors, "degree", input.degree, "学位", 160)
  validateOptionalText(fieldErrors, "major", input.major, "专业", 160)
  validateOptionalText(fieldErrors, "location", input.location, "地点", 120)
  validateOptionalText(fieldErrors, "description", input.description, "教育说明", 4000)
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
  const sortOrder = parseSortOrder(fieldErrors, "sortOrder", input.sortOrder)

  return {
    fieldErrors,
    sortOrder,
  }
}

function normalizeEducationInput(
  input: EducationInput,
  sortOrder: number
): EducationWriteInput {
  return {
    resumeId: input.resumeId.trim(),
    school: input.school.trim(),
    degree: optionalText(input.degree),
    major: optionalText(input.major),
    location: optionalText(input.location),
    startDate: normalizeDateInput(input.startDate),
    endDate: normalizeDateInput(input.endDate),
    description: optionalText(input.description),
    sortOrder,
    isVisible: input.isVisible,
  }
}

function educationForeignKeyError(): EducationMutationResult {
  return {
    ok: false,
    message: "关联资料不存在，请刷新后重试",
    fieldErrors: {
      resumeId: "请选择有效的简历资料",
    },
  }
}

export { getResumeReferences, type ResumeReference }

export async function getEducationRecords() {
  const rows = await listEducation()
  return rows.map(rowToEducation)
}

export async function createManagedEducation(
  input: EducationInput,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<EducationMutationResult> {
  const { fieldErrors, sortOrder } = validateEducationInput(input)

  if (sortOrder === null) {
    return {
      ok: false,
      message: "请检查教育经历表单",
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
      message: "请检查教育经历表单",
      fieldErrors,
    }
  }

  try {
    const row = await createEducationRecord(normalizeEducationInput(input, sortOrder))
    const education = rowToEducation(row)

    await writeAuditLog({
      adminUserId: admin.id,
      action: "education.create",
      entityType: "education",
      entityId: education.id,
      metadata: {
        resume_slug: education.resumeSlug,
        school: education.school,
        degree: education.degree || null,
      },
      context,
    })

    return {
      ok: true,
      education,
      message: `已创建教育经历「${education.school}」`,
    }
  } catch (error) {
    if (hasDatabaseCode(error, "23503")) {
      return educationForeignKeyError()
    }

    return {
      ok: false,
      message: "保存失败，请稍后重试",
    }
  }
}

export async function updateManagedEducation(
  educationId: string,
  input: EducationInput,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<EducationMutationResult> {
  const { fieldErrors, sortOrder } = validateEducationInput(input)

  if (sortOrder === null) {
    return {
      ok: false,
      message: "请检查教育经历表单",
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
      message: "请检查教育经历表单",
      fieldErrors,
    }
  }

  try {
    const row = await updateEducationRecord(
      educationId,
      normalizeEducationInput(input, sortOrder)
    )

    if (!row) {
      return {
        ok: false,
        message: "教育经历不存在或已被删除",
      }
    }

    const education = rowToEducation(row)

    await writeAuditLog({
      adminUserId: admin.id,
      action: "education.update",
      entityType: "education",
      entityId: education.id,
      metadata: {
        resume_slug: education.resumeSlug,
        school: education.school,
        degree: education.degree || null,
      },
      context,
    })

    return {
      ok: true,
      education,
      message: `已保存教育经历「${education.school}」`,
    }
  } catch (error) {
    if (hasDatabaseCode(error, "23503")) {
      return educationForeignKeyError()
    }

    return {
      ok: false,
      message: "保存失败，请稍后重试",
    }
  }
}

export async function deleteManagedEducation(
  educationId: string,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<DeleteEducationResult> {
  const education = await findEducationById(educationId)

  if (!education) {
    return {
      ok: false,
      message: "教育经历不存在或已被删除",
    }
  }

  const deleted = await deleteEducationRecord(educationId)

  if (!deleted) {
    return {
      ok: false,
      message: "教育经历不存在或已被删除",
    }
  }

  await writeAuditLog({
    adminUserId: admin.id,
    action: "education.delete",
    entityType: "education",
    entityId: education.id,
    metadata: {
      resume_slug: education.resume_slug,
      school: education.school,
      degree: education.degree,
    },
    context,
  })

  return {
    ok: true,
    message: `已删除教育经历「${education.school}」`,
  }
}
