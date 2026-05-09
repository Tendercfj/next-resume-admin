import type { CurrentAdmin } from "@/lib/auth/session"
import {
  createResume,
  deleteResume,
  findResumeById,
  listResumes,
  updateResume,
  type ResumeRow,
  type ResumeWriteInput,
} from "@/lib/dao/resumes-dao"
import {
  writeAuditLog,
  type RequestAuditContext,
} from "@/lib/services/admin-audit-service"

export type ResumeProfile = {
  id: string
  slug: string
  locale: string
  title: string
  ownerName: string
  headline: string
  summary: string
  avatarUrl: string
  location: string
  email: string
  phone: string
  websiteUrl: string
  githubUrl: string
  linkedinUrl: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export type ResumeProfileInput = {
  slug: string
  locale: string
  title: string
  ownerName: string
  headline: string
  summary: string
  avatarUrl: string
  location: string
  email: string
  phone: string
  websiteUrl: string
  githubUrl: string
  linkedinUrl: string
  isPublished: boolean
}

export type ResumeProfileFieldErrors = Partial<
  Record<keyof ResumeProfileInput, string>
>

export type ResumeProfileMutationResult =
  | {
      ok: true
      resume: ResumeProfile
      message: string
    }
  | {
      ok: false
      message: string
      fieldErrors?: ResumeProfileFieldErrors
    }

export type DeleteResumeProfileResult =
  | {
      ok: true
      message: string
    }
  | {
      ok: false
      message: string
      fieldErrors?: {
        confirmSlug?: string
      }
    }

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const localePattern = /^[a-z]{2}(?:-[A-Z]{2})?$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function rowToProfile(row: ResumeRow): ResumeProfile {
  return {
    id: row.id,
    slug: row.slug,
    locale: row.locale,
    title: row.title,
    ownerName: row.owner_name,
    headline: row.headline ?? "",
    summary: row.summary ?? "",
    avatarUrl: row.avatar_url ?? "",
    location: row.location ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    websiteUrl: row.website_url ?? "",
    githubUrl: row.github_url ?? "",
    linkedinUrl: row.linkedin_url ?? "",
    isPublished: row.is_published,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  }
}

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

function validateRequiredText(
  fieldErrors: ResumeProfileFieldErrors,
  key: keyof ResumeProfileInput,
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
  fieldErrors: ResumeProfileFieldErrors,
  key: keyof ResumeProfileInput,
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
  fieldErrors: ResumeProfileFieldErrors,
  key: keyof ResumeProfileInput,
  value: string,
  label: string
) {
  const normalized = value.trim()

  if (!normalized) {
    return
  }

  if (normalized.length > 500) {
    fieldErrors[key] = `${label}不能超过 500 个字符`
    return
  }

  try {
    const url = new URL(normalized)

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      fieldErrors[key] = `${label}必须以 http:// 或 https:// 开头`
    }
  } catch {
    fieldErrors[key] = `请输入有效的${label}`
  }
}

function validateResumeProfileInput(input: ResumeProfileInput) {
  const fieldErrors: ResumeProfileFieldErrors = {}

  validateRequiredText(fieldErrors, "slug", input.slug, "Slug", 80)
  if (input.slug.trim() && !slugPattern.test(input.slug.trim())) {
    fieldErrors.slug = "Slug 只能使用小写字母、数字和中横线"
  }

  validateRequiredText(fieldErrors, "locale", input.locale, "语言代码", 12)
  if (input.locale.trim() && !localePattern.test(input.locale.trim())) {
    fieldErrors.locale = "语言代码格式应类似 zh-CN 或 en"
  }

  validateRequiredText(fieldErrors, "title", input.title, "简历标题", 120)
  validateRequiredText(fieldErrors, "ownerName", input.ownerName, "姓名", 120)
  validateOptionalText(fieldErrors, "headline", input.headline, "一句话定位", 200)
  validateOptionalText(fieldErrors, "summary", input.summary, "简介", 2000)
  validateOptionalText(fieldErrors, "location", input.location, "所在地", 120)
  validateOptionalText(fieldErrors, "phone", input.phone, "电话", 80)

  if (input.email.trim()) {
    validateOptionalText(fieldErrors, "email", input.email, "邮箱", 254)
    if (!emailPattern.test(input.email.trim())) {
      fieldErrors.email = "请输入有效的邮箱地址"
    }
  }

  validateUrl(fieldErrors, "avatarUrl", input.avatarUrl, "头像 URL")
  validateUrl(fieldErrors, "websiteUrl", input.websiteUrl, "个人网站 URL")
  validateUrl(fieldErrors, "githubUrl", input.githubUrl, "GitHub URL")
  validateUrl(fieldErrors, "linkedinUrl", input.linkedinUrl, "LinkedIn URL")

  return fieldErrors
}

function normalizeResumeProfileInput(
  input: ResumeProfileInput
): ResumeWriteInput {
  return {
    slug: input.slug.trim(),
    locale: input.locale.trim() || "zh-CN",
    title: input.title.trim(),
    ownerName: input.ownerName.trim(),
    headline: optionalText(input.headline),
    summary: optionalText(input.summary),
    avatarUrl: optionalText(input.avatarUrl),
    location: optionalText(input.location),
    email: optionalText(input.email),
    phone: optionalText(input.phone),
    websiteUrl: optionalText(input.websiteUrl),
    githubUrl: optionalText(input.githubUrl),
    linkedinUrl: optionalText(input.linkedinUrl),
    isPublished: input.isPublished,
  }
}

function hasDatabaseCode(error: unknown, code: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === code
  )
}

function uniqueSlugError(): ResumeProfileMutationResult {
  return {
    ok: false,
    message: "保存失败：Slug 已被占用",
    fieldErrors: {
      slug: "这个 Slug 已存在，请换一个",
    },
  }
}

export async function getResumeProfiles() {
  const rows = await listResumes()
  return rows.map(rowToProfile)
}

export async function createResumeProfile(
  input: ResumeProfileInput,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<ResumeProfileMutationResult> {
  const fieldErrors = validateResumeProfileInput(input)

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "请检查资料表单",
      fieldErrors,
    }
  }

  try {
    const row = await createResume(normalizeResumeProfileInput(input))
    const resume = rowToProfile(row)

    await writeAuditLog({
      adminUserId: admin.id,
      action: "resume.create",
      entityType: "resume",
      entityId: resume.id,
      metadata: {
        slug: resume.slug,
        is_published: resume.isPublished,
      },
      context,
    })

    return {
      ok: true,
      resume,
      message: `已创建「${resume.title}」`,
    }
  } catch (error) {
    if (hasDatabaseCode(error, "23505")) {
      return uniqueSlugError()
    }

    return {
      ok: false,
      message: "保存失败，请稍后重试",
    }
  }
}

export async function updateResumeProfile(
  resumeId: string,
  input: ResumeProfileInput,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<ResumeProfileMutationResult> {
  const fieldErrors = validateResumeProfileInput(input)

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "请检查资料表单",
      fieldErrors,
    }
  }

  try {
    const row = await updateResume(resumeId, normalizeResumeProfileInput(input))

    if (!row) {
      return {
        ok: false,
        message: "资料不存在或已被删除",
      }
    }

    const resume = rowToProfile(row)

    await writeAuditLog({
      adminUserId: admin.id,
      action: "resume.update",
      entityType: "resume",
      entityId: resume.id,
      metadata: {
        slug: resume.slug,
        is_published: resume.isPublished,
      },
      context,
    })

    return {
      ok: true,
      resume,
      message: `已保存「${resume.title}」`,
    }
  } catch (error) {
    if (hasDatabaseCode(error, "23505")) {
      return uniqueSlugError()
    }

    return {
      ok: false,
      message: "保存失败，请稍后重试",
    }
  }
}

export async function deleteResumeProfile(
  resumeId: string,
  confirmSlug: string,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<DeleteResumeProfileResult> {
  const resume = await findResumeById(resumeId)

  if (!resume) {
    return {
      ok: false,
      message: "资料不存在或已被删除",
    }
  }

  if (confirmSlug.trim() !== resume.slug) {
    return {
      ok: false,
      message: "删除确认不匹配",
      fieldErrors: {
        confirmSlug: `请输入 ${resume.slug} 确认删除`,
      },
    }
  }

  const deleted = await deleteResume(resumeId)

  if (!deleted) {
    return {
      ok: false,
      message: "资料不存在或已被删除",
    }
  }

  await writeAuditLog({
    adminUserId: admin.id,
    action: "resume.delete",
    entityType: "resume",
    entityId: resume.id,
    metadata: {
      slug: resume.slug,
      title: resume.title,
    },
    context,
  })

  return {
    ok: true,
    message: `已删除「${resume.title}」`,
  }
}
