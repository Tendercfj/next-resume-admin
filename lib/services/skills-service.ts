import type { CurrentAdmin } from "@/lib/auth/session"
import {
  createSkillGroup,
  deleteSkillGroup,
  findSkillGroupById,
  listSkillGroups,
  updateSkillGroup,
  type SkillGroupRow,
  type SkillGroupWriteInput,
} from "@/lib/dao/skill-groups-dao"
import {
  createSkillItem,
  deleteSkillItem,
  findSkillItemById,
  listSkillItemsByGroupIds,
  updateSkillItem,
  type SkillItemRow,
  type SkillItemWriteInput,
} from "@/lib/dao/skill-items-dao"
import { listResumes } from "@/lib/dao/resumes-dao"
import {
  writeAuditLog,
  type RequestAuditContext,
} from "@/lib/services/admin-audit-service"

export const SKILL_LEVELS = ["familiar", "proficient", "expert"] as const

export type SkillLevel = (typeof SKILL_LEVELS)[number]

export type ResumeReference = {
  id: string
  slug: string
  title: string
  ownerName: string
  isPublished: boolean
}

export type SkillItem = {
  id: string
  groupId: string
  groupName: string
  resumeId: string
  resumeSlug: string
  resumeTitle: string
  name: string
  level: SkillLevel | ""
  keywords: string[]
  sortOrder: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export type SkillGroup = {
  id: string
  resumeId: string
  resumeSlug: string
  resumeTitle: string
  resumeOwnerName: string
  resumeIsPublished: boolean
  name: string
  description: string
  sortOrder: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
  items: SkillItem[]
}

export type SkillGroupInput = {
  resumeId: string
  name: string
  description: string
  sortOrder: string
  isVisible: boolean
}

export type SkillItemInput = {
  groupId: string
  name: string
  level: string
  keywordsText: string
  sortOrder: string
  isVisible: boolean
}

export type SkillGroupFieldErrors = Partial<Record<keyof SkillGroupInput, string>>

export type SkillItemFieldErrors = Partial<Record<keyof SkillItemInput, string>>

export type SkillGroupMutationResult =
  | {
      ok: true
      group: SkillGroup
      message: string
    }
  | {
      ok: false
      message: string
      fieldErrors?: SkillGroupFieldErrors
    }

export type SkillItemMutationResult =
  | {
      ok: true
      item: SkillItem
      message: string
    }
  | {
      ok: false
      message: string
      fieldErrors?: SkillItemFieldErrors
    }

export type DeleteSkillGroupResult =
  | {
      ok: true
      message: string
    }
  | {
      ok: false
      message: string
    }

export type DeleteSkillItemResult =
  | {
      ok: true
      message: string
    }
  | {
      ok: false
      message: string
    }

type KeywordParseResult =
  | {
      ok: true
      keywords: string[]
    }
  | {
      ok: false
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

function resumeToReference(row: Awaited<ReturnType<typeof listResumes>>[number]): ResumeReference {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    ownerName: row.owner_name,
    isPublished: row.is_published,
  }
}

function rowToSkillItem(row: SkillItemRow): SkillItem {
  return {
    id: row.id,
    groupId: row.group_id,
    groupName: row.group_name,
    resumeId: row.resume_id,
    resumeSlug: row.resume_slug,
    resumeTitle: row.resume_title,
    name: row.name,
    level: row.level ?? "",
    keywords: row.keywords ?? [],
    sortOrder: row.sort_order,
    isVisible: row.is_visible,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  }
}

function rowToSkillGroup(row: SkillGroupRow, items: SkillItem[]): SkillGroup {
  return {
    id: row.id,
    resumeId: row.resume_id,
    resumeSlug: row.resume_slug,
    resumeTitle: row.resume_title,
    resumeOwnerName: row.resume_owner_name,
    resumeIsPublished: row.resume_is_published,
    name: row.name,
    description: row.description ?? "",
    sortOrder: row.sort_order,
    isVisible: row.is_visible,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    items,
  }
}

function validateRequiredText<TField extends string>(
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

function validateOptionalText<TField extends string>(
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

function parseSortOrder<TField extends string>(
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

function parseSkillKeywords(
  fieldErrors: SkillItemFieldErrors,
  value: string
): KeywordParseResult {
  const normalized = value.trim()

  if (!normalized) {
    return {
      ok: true,
      keywords: [],
    }
  }

  if (normalized.length > 1000) {
    fieldErrors.keywordsText = "关键词输入不能超过 1000 个字符"
    return {
      ok: false,
    }
  }

  const uniqueKeywords: string[] = []
  const seen = new Set<string>()

  for (const rawKeyword of normalized.split(/[\n,，]+/)) {
    const keyword = rawKeyword.trim()

    if (!keyword) {
      continue
    }

    if (keyword.length > 40) {
      fieldErrors.keywordsText = "单个关键词不能超过 40 个字符"
      return {
        ok: false,
      }
    }

    if (seen.has(keyword)) {
      continue
    }

    seen.add(keyword)
    uniqueKeywords.push(keyword)
  }

  if (uniqueKeywords.length > 24) {
    fieldErrors.keywordsText = "关键词最多保留 24 个"
    return {
      ok: false,
    }
  }

  return {
    ok: true,
    keywords: uniqueKeywords,
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

function skillGroupUniqueNameError(): SkillGroupMutationResult {
  return {
    ok: false,
    message: "保存失败：同一份资料下分组名称不能重复",
    fieldErrors: {
      name: "该资料下已经存在同名技能分组",
    },
  }
}

function groupForeignKeyError(): SkillGroupMutationResult {
  return {
    ok: false,
    message: "关联资料不存在，请刷新后重试",
    fieldErrors: {
      resumeId: "请选择有效的简历资料",
    },
  }
}

function itemForeignKeyError(): SkillItemMutationResult {
  return {
    ok: false,
    message: "关联技能分组不存在，请刷新后重试",
    fieldErrors: {
      groupId: "请选择有效的技能分组",
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

function validateSkillGroupInput(input: SkillGroupInput) {
  const fieldErrors: SkillGroupFieldErrors = {}

  validateRequiredText(fieldErrors, "resumeId", input.resumeId, "关联资料", 100)
  validateRequiredText(fieldErrors, "name", input.name, "分组名称", 120)
  validateOptionalText(fieldErrors, "description", input.description, "分组说明", 500)
  const sortOrder = parseSortOrder(fieldErrors, "sortOrder", input.sortOrder)

  return {
    fieldErrors,
    sortOrder,
  }
}

function validateSkillItemInput(input: SkillItemInput) {
  const fieldErrors: SkillItemFieldErrors = {}

  validateRequiredText(fieldErrors, "groupId", input.groupId, "所属分组", 100)
  validateRequiredText(fieldErrors, "name", input.name, "技能名称", 120)

  if (input.level.trim() && !SKILL_LEVELS.includes(input.level.trim() as SkillLevel)) {
    fieldErrors.level = "熟练度只能选择熟悉、熟练或精通"
  }

  const keywordResult = parseSkillKeywords(fieldErrors, input.keywordsText)
  const sortOrder = parseSortOrder(fieldErrors, "sortOrder", input.sortOrder)

  return {
    fieldErrors,
    sortOrder,
    keywordResult,
  }
}

function normalizeSkillGroupInput(
  input: SkillGroupInput,
  sortOrder: number
): SkillGroupWriteInput {
  return {
    resumeId: input.resumeId.trim(),
    name: input.name.trim(),
    description: optionalText(input.description),
    sortOrder,
    isVisible: input.isVisible,
  }
}

function normalizeSkillItemInput(
  input: SkillItemInput,
  sortOrder: number,
  keywords: string[]
): SkillItemWriteInput {
  const normalizedLevel = input.level.trim()

  return {
    groupId: input.groupId.trim(),
    name: input.name.trim(),
    level: normalizedLevel ? (normalizedLevel as SkillLevel) : null,
    keywords,
    sortOrder,
    isVisible: input.isVisible,
  }
}

export async function getResumeReferences() {
  return loadResumeReferences()
}

export async function getSkillGroupsWithItems() {
  const groupRows = await listSkillGroups()

  if (groupRows.length === 0) {
    return []
  }

  const itemRows = await listSkillItemsByGroupIds(groupRows.map((group) => group.id))
  const itemsByGroupId = new Map<string, SkillItem[]>()

  for (const itemRow of itemRows) {
    const groupItems = itemsByGroupId.get(itemRow.group_id) ?? []
    groupItems.push(rowToSkillItem(itemRow))
    itemsByGroupId.set(itemRow.group_id, groupItems)
  }

  return groupRows.map((groupRow) =>
    rowToSkillGroup(groupRow, itemsByGroupId.get(groupRow.id) ?? [])
  )
}

export async function createManagedSkillGroup(
  input: SkillGroupInput,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<SkillGroupMutationResult> {
  const { fieldErrors, sortOrder } = validateSkillGroupInput(input)

  if (sortOrder === null) {
    return {
      ok: false,
      message: "请检查技能分组表单",
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
      message: "请检查技能分组表单",
      fieldErrors,
    }
  }

  try {
    const row = await createSkillGroup(normalizeSkillGroupInput(input, sortOrder))
    const group = rowToSkillGroup(row, [])

    await writeAuditLog({
      adminUserId: admin.id,
      action: "skill-group.create",
      entityType: "skill_group",
      entityId: group.id,
      metadata: {
        resume_slug: group.resumeSlug,
        group_name: group.name,
        sort_order: group.sortOrder,
        is_visible: group.isVisible,
      },
      context,
    })

    return {
      ok: true,
      group,
      message: `已创建技能分组「${group.name}」`,
    }
  } catch (error) {
    if (hasDatabaseCode(error, "23505")) {
      return skillGroupUniqueNameError()
    }

    if (hasDatabaseCode(error, "23503")) {
      return groupForeignKeyError()
    }

    return {
      ok: false,
      message: "保存失败，请稍后重试",
    }
  }
}

export async function updateManagedSkillGroup(
  groupId: string,
  input: SkillGroupInput,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<SkillGroupMutationResult> {
  const { fieldErrors, sortOrder } = validateSkillGroupInput(input)

  if (sortOrder === null) {
    return {
      ok: false,
      message: "请检查技能分组表单",
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
      message: "请检查技能分组表单",
      fieldErrors,
    }
  }

  try {
    const row = await updateSkillGroup(
      groupId,
      normalizeSkillGroupInput(input, sortOrder)
    )

    if (!row) {
      return {
        ok: false,
        message: "技能分组不存在或已被删除",
      }
    }

    const group = rowToSkillGroup(row, [])

    await writeAuditLog({
      adminUserId: admin.id,
      action: "skill-group.update",
      entityType: "skill_group",
      entityId: group.id,
      metadata: {
        resume_slug: group.resumeSlug,
        group_name: group.name,
        sort_order: group.sortOrder,
        is_visible: group.isVisible,
      },
      context,
    })

    return {
      ok: true,
      group,
      message: `已保存技能分组「${group.name}」`,
    }
  } catch (error) {
    if (hasDatabaseCode(error, "23505")) {
      return skillGroupUniqueNameError()
    }

    if (hasDatabaseCode(error, "23503")) {
      return groupForeignKeyError()
    }

    return {
      ok: false,
      message: "保存失败，请稍后重试",
    }
  }
}

export async function deleteManagedSkillGroup(
  groupId: string,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<DeleteSkillGroupResult> {
  const group = await findSkillGroupById(groupId)

  if (!group) {
    return {
      ok: false,
      message: "技能分组不存在或已被删除",
    }
  }

  const itemCount = (await listSkillItemsByGroupIds([groupId])).length
  const deleted = await deleteSkillGroup(groupId)

  if (!deleted) {
    return {
      ok: false,
      message: "技能分组不存在或已被删除",
    }
  }

  await writeAuditLog({
    adminUserId: admin.id,
    action: "skill-group.delete",
    entityType: "skill_group",
    entityId: group.id,
    metadata: {
      resume_slug: group.resume_slug,
      group_name: group.name,
      item_count: itemCount,
    },
    context,
  })

  return {
    ok: true,
    message: `已删除技能分组「${group.name}」`,
  }
}

export async function createManagedSkillItem(
  input: SkillItemInput,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<SkillItemMutationResult> {
  const { fieldErrors, sortOrder, keywordResult } = validateSkillItemInput(input)

  if (sortOrder === null || !keywordResult.ok) {
    return {
      ok: false,
      message: "请检查技能项表单",
      fieldErrors,
    }
  }

  const group = await findSkillGroupById(input.groupId.trim())

  if (!group) {
    fieldErrors.groupId = "请选择有效的技能分组"
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "请检查技能项表单",
      fieldErrors,
    }
  }

  try {
    const row = await createSkillItem(
      normalizeSkillItemInput(input, sortOrder, keywordResult.keywords)
    )
    const item = rowToSkillItem(row)

    await writeAuditLog({
      adminUserId: admin.id,
      action: "skill-item.create",
      entityType: "skill_item",
      entityId: item.id,
      metadata: {
        resume_slug: item.resumeSlug,
        group_name: item.groupName,
        item_name: item.name,
        level: item.level || null,
        keyword_count: item.keywords.length,
      },
      context,
    })

    return {
      ok: true,
      item,
      message: `已创建技能项「${item.name}」`,
    }
  } catch (error) {
    if (hasDatabaseCode(error, "23503")) {
      return itemForeignKeyError()
    }

    return {
      ok: false,
      message: "保存失败，请稍后重试",
    }
  }
}

export async function updateManagedSkillItem(
  itemId: string,
  input: SkillItemInput,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<SkillItemMutationResult> {
  const { fieldErrors, sortOrder, keywordResult } = validateSkillItemInput(input)

  if (sortOrder === null || !keywordResult.ok) {
    return {
      ok: false,
      message: "请检查技能项表单",
      fieldErrors,
    }
  }

  const group = await findSkillGroupById(input.groupId.trim())

  if (!group) {
    fieldErrors.groupId = "请选择有效的技能分组"
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "请检查技能项表单",
      fieldErrors,
    }
  }

  try {
    const row = await updateSkillItem(
      itemId,
      normalizeSkillItemInput(input, sortOrder, keywordResult.keywords)
    )

    if (!row) {
      return {
        ok: false,
        message: "技能项不存在或已被删除",
      }
    }

    const item = rowToSkillItem(row)

    await writeAuditLog({
      adminUserId: admin.id,
      action: "skill-item.update",
      entityType: "skill_item",
      entityId: item.id,
      metadata: {
        resume_slug: item.resumeSlug,
        group_name: item.groupName,
        item_name: item.name,
        level: item.level || null,
        keyword_count: item.keywords.length,
      },
      context,
    })

    return {
      ok: true,
      item,
      message: `已保存技能项「${item.name}」`,
    }
  } catch (error) {
    if (hasDatabaseCode(error, "23503")) {
      return itemForeignKeyError()
    }

    return {
      ok: false,
      message: "保存失败，请稍后重试",
    }
  }
}

export async function deleteManagedSkillItem(
  itemId: string,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<DeleteSkillItemResult> {
  const item = await findSkillItemById(itemId)

  if (!item) {
    return {
      ok: false,
      message: "技能项不存在或已被删除",
    }
  }

  const deleted = await deleteSkillItem(itemId)

  if (!deleted) {
    return {
      ok: false,
      message: "技能项不存在或已被删除",
    }
  }

  await writeAuditLog({
    adminUserId: admin.id,
    action: "skill-item.delete",
    entityType: "skill_item",
    entityId: item.id,
    metadata: {
      resume_slug: item.resume_slug,
      group_name: item.group_name,
      item_name: item.name,
    },
    context,
  })

  return {
    ok: true,
    message: `已删除技能项「${item.name}」`,
  }
}
