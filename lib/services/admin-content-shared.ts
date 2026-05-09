import { listResumes } from "@/lib/dao/resumes-dao"

export type ResumeReference = {
  id: string
  slug: string
  title: string
  ownerName: string
  isPublished: boolean
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/

function resumeToReference(
  row: Awaited<ReturnType<typeof listResumes>>[number]
): ResumeReference {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    ownerName: row.owner_name,
    isPublished: row.is_published,
  }
}

export async function getResumeReferences() {
  const rows = await listResumes()
  return rows.map(resumeToReference)
}

export async function getResumeReferenceMap() {
  const resumes = await getResumeReferences()
  return new Map(resumes.map((resume) => [resume.id, resume]))
}

export function toIsoString(value: string | Date) {
  if (value instanceof Date) {
    return value.toISOString()
  }

  return new Date(value).toISOString()
}

export function toDateInputString(value: string | Date | null) {
  if (!value) {
    return ""
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  return new Date(value).toISOString().slice(0, 10)
}

export function optionalText(value: string) {
  const normalized = value.trim()
  return normalized ? normalized : null
}

export function validateRequiredText<TField extends string>(
  fieldErrors: Partial<Record<TField, string>>,
  key: TField,
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

export function validateOptionalText<TField extends string>(
  fieldErrors: Partial<Record<TField, string>>,
  key: TField,
  value: string,
  label: string,
  maxLength: number
) {
  const normalized = value.trim()

  if (normalized.length > maxLength) {
    fieldErrors[key] = `${label}不能超过 ${maxLength} 个字符`
  }
}

export function validateUrl<TField extends string>(
  fieldErrors: Partial<Record<TField, string>>,
  key: TField,
  value: string,
  label: string,
  options?: {
    required?: boolean
    maxLength?: number
  }
) {
  const normalized = value.trim()
  const required = options?.required ?? false
  const maxLength = options?.maxLength ?? 500

  if (!normalized) {
    if (required) {
      fieldErrors[key] = `请输入${label}`
    }
    return
  }

  if (normalized.length > maxLength) {
    fieldErrors[key] = `${label}不能超过 ${maxLength} 个字符`
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

export function parseSortOrder<TField extends string>(
  fieldErrors: Partial<Record<TField, string>>,
  key: TField,
  value: string
) {
  const normalized = value.trim()

  if (!normalized) {
    return 0
  }

  if (!/^-?\d+$/.test(normalized)) {
    fieldErrors[key] = "排序必须是整数"
    return null
  }

  const sortOrder = Number.parseInt(normalized, 10)

  if (sortOrder < -9999 || sortOrder > 9999) {
    fieldErrors[key] = "排序范围需要在 -9999 到 9999 之间"
    return null
  }

  return sortOrder
}

function isValidDateString(value: string) {
  if (!datePattern.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  )
}

export function validateOptionalDate<TField extends string>(
  fieldErrors: Partial<Record<TField, string>>,
  key: TField,
  value: string,
  label: string
) {
  const normalized = value.trim()

  if (!normalized) {
    return
  }

  if (!isValidDateString(normalized)) {
    fieldErrors[key] = `${label}格式应为 YYYY-MM-DD`
  }
}

export function validateDateRange<TField extends string>(
  fieldErrors: Partial<Record<TField, string>>,
  startKey: TField,
  endKey: TField,
  startDateValue: string,
  endDateValue: string,
  endLabel: string
) {
  const startDate = startDateValue.trim()
  const endDate = endDateValue.trim()

  if (!startDate || !endDate) {
    return
  }

  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    return
  }

  if (endDate < startDate) {
    fieldErrors[endKey] = `${endLabel}不能早于开始日期`
    if (!fieldErrors[startKey]) {
      fieldErrors[startKey] = "请检查日期范围"
    }
  }
}

export function normalizeDateInput(value: string) {
  const normalized = value.trim()
  return normalized ? normalized : null
}

export function parseTextList<TField extends string>(
  fieldErrors: Partial<Record<TField, string>>,
  key: TField,
  value: string,
  label: string,
  options?: {
    maxItems?: number
    maxItemLength?: number
    maxTotalLength?: number
  }
) {
  const normalized = value.trim()
  const maxItems = options?.maxItems ?? 24
  const maxItemLength = options?.maxItemLength ?? 120
  const maxTotalLength = options?.maxTotalLength ?? 4000

  if (!normalized) {
    return []
  }

  if (normalized.length > maxTotalLength) {
    fieldErrors[key] = `${label}输入不能超过 ${maxTotalLength} 个字符`
    return null
  }

  const uniqueItems: string[] = []
  const seen = new Set<string>()

  for (const rawItem of normalized.split(/[\n,，]+/)) {
    const item = rawItem.trim()

    if (!item) {
      continue
    }

    if (item.length > maxItemLength) {
      fieldErrors[key] = `单个${label}不能超过 ${maxItemLength} 个字符`
      return null
    }

    if (seen.has(item)) {
      continue
    }

    seen.add(item)
    uniqueItems.push(item)
  }

  if (uniqueItems.length > maxItems) {
    fieldErrors[key] = `${label}最多保留 ${maxItems} 个`
    return null
  }

  return uniqueItems
}

export function hasDatabaseCode(error: unknown, code: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === code
  )
}
