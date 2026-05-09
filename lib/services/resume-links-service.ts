import type { CurrentAdmin } from "@/lib/auth/session"
import {
  createResumeLink,
  deleteResumeLink,
  findResumeLinkById,
  listResumeLinks,
  updateResumeLink,
  type ResumeLinkRow,
  type ResumeLinkWriteInput,
} from "@/lib/dao/resume-links-dao"
import { listResumes } from "@/lib/dao/resumes-dao"
import {
  writeAuditLog,
  type RequestAuditContext,
} from "@/lib/services/admin-audit-service"

export type ResumeReference = {
  id: string
  slug: string
  title: string
  ownerName: string
  isPublished: boolean
}

export type ResumeLink = {
  id: string
  resumeId: string
  resumeSlug: string
  resumeTitle: string
  resumeOwnerName: string
  resumeIsPublished: boolean
  label: string
  url: string
  icon: string
  sortOrder: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export type ResumeLinkInput = {
  resumeId: string
  label: string
  url: string
  icon: string
  sortOrder: string
  isVisible: boolean
}

export type ResumeLinkFieldErrors = Partial<Record<keyof ResumeLinkInput, string>>

export type ResumeLinkMutationResult =
  | {
      ok: true
      link: ResumeLink
      message: string
    }
  | {
      ok: false
      message: string
      fieldErrors?: ResumeLinkFieldErrors
    }

export type DeleteResumeLinkResult =
  | {
      ok: true
      message: string
    }
  | {
      ok: false
      message: string
    }

const urlProtocolLabel = "http:// 或 https://"

function toIsoString(value: string | Date) {
  if (value instanceof Date) {
    return value.toISOString()
  }

  return new Date(value).toISOString()
}

function optionalText(value: string) {
  const normalized = value.trim()
  return normalized ? normalized : null
}

function rowToResumeLink(row: ResumeLinkRow): ResumeLink {
  return {
    id: row.id,
    resumeId: row.resume_id,
    resumeSlug: row.resume_slug,
    resumeTitle: row.resume_title,
    resumeOwnerName: row.resume_owner_name,
    resumeIsPublished: row.resume_is_published,
    label: row.label,
    url: row.url,
    icon: row.icon ?? "",
    sortOrder: row.sort_order,
    isVisible: row.is_visible,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  }
}

function resumeToReference(row: Awaited<ReturnType<typeof listResumes>>[number]): ResumeReference {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    ownerName: row.owner_name,
    isPublished: row.is_published,
  }
}

function validateRequiredText(
  fieldErrors: ResumeLinkFieldErrors,
  key: keyof ResumeLinkInput,
  value: string,
  label: string,
  maxLength: number
) {
  const normalized = value.trim()

  if (!normalized) {
    fieldErrors[key] = `请输入${label}`
  } else if (normalized.length > maxLength) {
    fieldErrors[key] = `${label}不能超过 ${maxLength} 个字符`
  }
}

function validateOptionalText(
  fieldErrors: ResumeLinkFieldErrors,
  key: keyof ResumeLinkInput,
  value: string,
  label: string,
  maxLength: number
) {
  const normalized = value.trim()

  if (normalized.length > maxLength) {
    fieldErrors[key] = `${label}不能超过 ${maxLength} 个字符`
  }
}

function validateUrl(
  fieldErrors: ResumeLinkFieldErrors,
  key: keyof ResumeLinkInput,
  value: string,
  label: string
) {
  const normalized = value.trim()

  if (!normalized) {
    fieldErrors[key] = `请输入${label}`
    return
  }

  if (normalized.length > 500) {
    fieldErrors[key] = `${label}不能超过 500 个字符`
    return
  }

  try {
    const url = new URL(normalized)

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      fieldErrors[key] = `${label}必须以 ${urlProtocolLabel} 开头`
    }
  } catch {
    fieldErrors[key] = `请输入有效的${label}`
  }
}

function parseSortOrder(
  fieldErrors: ResumeLinkFieldErrors,
  value: string
) {
  const normalized = value.trim()

  if (!normalized) {
    return 0
  }

  if (!/^-?\d+$/.test(normalized)) {
    fieldErrors.sortOrder = "排序必须是整数"
    return null
  }

  const sortOrder = Number.parseInt(normalized, 10)

  if (sortOrder < -9999 || sortOrder > 9999) {
    fieldErrors.sortOrder = "排序范围需要在 -9999 到 9999 之间"
    return null
  }

  return sortOrder
}

function hasDatabaseCode(error: unknown, code: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === code
  )
}

function foreignKeyError(): ResumeLinkMutationResult {
  return {
    ok: false,
    message: "关联资料不存在，请刷新后重试",
    fieldErrors: {
      resumeId: "请选择有效的简历资料",
    },
  }
}

async function loadResumeReferences() {
  const rows = await listResumes()
  return rows.map(resumeToReference)
}

async function getResumeReferenceMap() {
  const resumes = await loadResumeReferences()
  return new Map(resumes.map((resume) => [resume.id, resume]))
}

function validateResumeLinkInput(input: ResumeLinkInput) {
  const fieldErrors: ResumeLinkFieldErrors = {}

  validateRequiredText(fieldErrors, "resumeId", input.resumeId, "关联资料", 100)
  validateRequiredText(fieldErrors, "label", input.label, "链接名称", 120)
  validateUrl(fieldErrors, "url", input.url, "链接地址")
  validateOptionalText(fieldErrors, "icon", input.icon, "图标键", 80)
  const sortOrder = parseSortOrder(fieldErrors, input.sortOrder)

  return {
    fieldErrors,
    sortOrder,
  }
}

function normalizeResumeLinkInput(
  input: ResumeLinkInput,
  sortOrder: number
): ResumeLinkWriteInput {
  return {
    resumeId: input.resumeId.trim(),
    label: input.label.trim(),
    url: input.url.trim(),
    icon: optionalText(input.icon),
    sortOrder,
    isVisible: input.isVisible,
  }
}

export async function getResumeReferences() {
  return loadResumeReferences()
}

export async function getResumeLinks() {
  const rows = await listResumeLinks()
  return rows.map(rowToResumeLink)
}

export async function createManagedResumeLink(
  input: ResumeLinkInput,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<ResumeLinkMutationResult> {
  const { fieldErrors, sortOrder } = validateResumeLinkInput(input)

  if (sortOrder === null) {
    return {
      ok: false,
      message: "请检查链接表单",
      fieldErrors,
    }
  }

  const resumeMap = await getResumeReferenceMap()
  const selectedResume = resumeMap.get(input.resumeId.trim())

  if (!selectedResume) {
    fieldErrors.resumeId = "请选择有效的简历资料"
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "请检查链接表单",
      fieldErrors,
    }
  }

  try {
    const row = await createResumeLink(normalizeResumeLinkInput(input, sortOrder))
    const link = rowToResumeLink(row)

    await writeAuditLog({
      adminUserId: admin.id,
      action: "resume-link.create",
      entityType: "resume_link",
      entityId: link.id,
      metadata: {
        resume_slug: link.resumeSlug,
        label: link.label,
        sort_order: link.sortOrder,
        is_visible: link.isVisible,
      },
      context,
    })

    return {
      ok: true,
      link,
      message: `已创建链接「${link.label}」`,
    }
  } catch (error) {
    if (hasDatabaseCode(error, "23503")) {
      return foreignKeyError()
    }

    return {
      ok: false,
      message: "保存失败，请稍后重试",
    }
  }
}

export async function updateManagedResumeLink(
  linkId: string,
  input: ResumeLinkInput,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<ResumeLinkMutationResult> {
  const { fieldErrors, sortOrder } = validateResumeLinkInput(input)

  if (sortOrder === null) {
    return {
      ok: false,
      message: "请检查链接表单",
      fieldErrors,
    }
  }

  const resumeMap = await getResumeReferenceMap()
  const selectedResume = resumeMap.get(input.resumeId.trim())

  if (!selectedResume) {
    fieldErrors.resumeId = "请选择有效的简历资料"
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "请检查链接表单",
      fieldErrors,
    }
  }

  try {
    const row = await updateResumeLink(
      linkId,
      normalizeResumeLinkInput(input, sortOrder)
    )

    if (!row) {
      return {
        ok: false,
        message: "链接不存在或已被删除",
      }
    }

    const link = rowToResumeLink(row)

    await writeAuditLog({
      adminUserId: admin.id,
      action: "resume-link.update",
      entityType: "resume_link",
      entityId: link.id,
      metadata: {
        resume_slug: link.resumeSlug,
        label: link.label,
        sort_order: link.sortOrder,
        is_visible: link.isVisible,
      },
      context,
    })

    return {
      ok: true,
      link,
      message: `已保存链接「${link.label}」`,
    }
  } catch (error) {
    if (hasDatabaseCode(error, "23503")) {
      return foreignKeyError()
    }

    return {
      ok: false,
      message: "保存失败，请稍后重试",
    }
  }
}

export async function deleteManagedResumeLink(
  linkId: string,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<DeleteResumeLinkResult> {
  const link = await findResumeLinkById(linkId)

  if (!link) {
    return {
      ok: false,
      message: "链接不存在或已被删除",
    }
  }

  const deleted = await deleteResumeLink(linkId)

  if (!deleted) {
    return {
      ok: false,
      message: "链接不存在或已被删除",
    }
  }

  await writeAuditLog({
    adminUserId: admin.id,
    action: "resume-link.delete",
    entityType: "resume_link",
    entityId: link.id,
    metadata: {
      resume_slug: link.resume_slug,
      label: link.label,
      url: link.url,
    },
    context,
  })

  return {
    ok: true,
    message: `已删除链接「${link.label}」`,
  }
}
