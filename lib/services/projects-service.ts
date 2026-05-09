import type { CurrentAdmin } from "@/lib/auth/session"
import {
  createProject,
  deleteProject,
  findProjectById,
  listProjects,
  updateProject,
  type ProjectRow,
  type ProjectWriteInput,
} from "@/lib/dao/projects-dao"
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
  validateUrl,
} from "@/lib/services/admin-content-shared"
import {
  writeAuditLog,
  type RequestAuditContext,
} from "@/lib/services/admin-audit-service"

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export type ProjectRecord = {
  id: string
  resumeId: string
  resumeSlug: string
  resumeTitle: string
  resumeOwnerName: string
  resumeIsPublished: boolean
  slug: string
  name: string
  role: string
  description: string
  techStack: string[]
  highlights: string[]
  projectUrl: string
  sourceUrl: string
  startDate: string
  endDate: string
  isFeatured: boolean
  sortOrder: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export type ProjectInput = {
  resumeId: string
  slug: string
  name: string
  role: string
  description: string
  techStackText: string
  highlightsText: string
  projectUrl: string
  sourceUrl: string
  startDate: string
  endDate: string
  isFeatured: boolean
  sortOrder: string
  isVisible: boolean
}

export type ProjectFieldErrors = Partial<Record<keyof ProjectInput, string>>

export type ProjectMutationResult =
  | {
      ok: true
      project: ProjectRecord
      message: string
    }
  | {
      ok: false
      message: string
      fieldErrors?: ProjectFieldErrors
    }

export type DeleteProjectResult =
  | {
      ok: true
      message: string
    }
  | {
      ok: false
      message: string
    }

function rowToProject(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    resumeId: row.resume_id,
    resumeSlug: row.resume_slug,
    resumeTitle: row.resume_title,
    resumeOwnerName: row.resume_owner_name,
    resumeIsPublished: row.resume_is_published,
    slug: row.slug,
    name: row.name,
    role: row.role ?? "",
    description: row.description ?? "",
    techStack: row.tech_stack ?? [],
    highlights: row.highlights ?? [],
    projectUrl: row.project_url ?? "",
    sourceUrl: row.source_url ?? "",
    startDate: toDateInputString(row.start_date),
    endDate: toDateInputString(row.end_date),
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    isVisible: row.is_visible,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  }
}

function validateProjectInput(input: ProjectInput) {
  const fieldErrors: ProjectFieldErrors = {}

  validateRequiredText(fieldErrors, "resumeId", input.resumeId, "关联资料", 100)
  validateRequiredText(fieldErrors, "slug", input.slug, "项目 Slug", 80)
  validateRequiredText(fieldErrors, "name", input.name, "项目名称", 160)
  validateOptionalText(fieldErrors, "role", input.role, "项目角色", 160)
  validateOptionalText(fieldErrors, "description", input.description, "项目简介", 4000)
  validateUrl(fieldErrors, "projectUrl", input.projectUrl, "项目链接")
  validateUrl(fieldErrors, "sourceUrl", input.sourceUrl, "源码链接")
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

  if (input.slug.trim() && !slugPattern.test(input.slug.trim())) {
    fieldErrors.slug = "Slug 只能使用小写字母、数字和中横线"
  }

  const techStack = parseTextList(
    fieldErrors,
    "techStackText",
    input.techStackText,
    "技术栈",
    {
      maxItems: 24,
      maxItemLength: 80,
      maxTotalLength: 2000,
    }
  )
  const highlights = parseTextList(
    fieldErrors,
    "highlightsText",
    input.highlightsText,
    "项目亮点",
    {
      maxItems: 16,
      maxItemLength: 240,
      maxTotalLength: 4000,
    }
  )
  const sortOrder = parseSortOrder(fieldErrors, "sortOrder", input.sortOrder)

  return {
    fieldErrors,
    techStack,
    highlights,
    sortOrder,
  }
}

function normalizeProjectInput(
  input: ProjectInput,
  techStack: string[],
  highlights: string[],
  sortOrder: number
): ProjectWriteInput {
  return {
    resumeId: input.resumeId.trim(),
    slug: input.slug.trim(),
    name: input.name.trim(),
    role: optionalText(input.role),
    description: optionalText(input.description),
    techStack,
    highlights,
    projectUrl: optionalText(input.projectUrl),
    sourceUrl: optionalText(input.sourceUrl),
    startDate: normalizeDateInput(input.startDate),
    endDate: normalizeDateInput(input.endDate),
    isFeatured: input.isFeatured,
    sortOrder,
    isVisible: input.isVisible,
  }
}

function projectForeignKeyError(): ProjectMutationResult {
  return {
    ok: false,
    message: "关联资料不存在，请刷新后重试",
    fieldErrors: {
      resumeId: "请选择有效的简历资料",
    },
  }
}

function projectUniqueSlugError(): ProjectMutationResult {
  return {
    ok: false,
    message: "保存失败：Slug 已被占用",
    fieldErrors: {
      slug: "该资料下已经存在相同的项目 Slug",
    },
  }
}

export { getResumeReferences, type ResumeReference }

export async function getProjects() {
  const rows = await listProjects()
  return rows.map(rowToProject)
}

export async function createManagedProject(
  input: ProjectInput,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<ProjectMutationResult> {
  const { fieldErrors, techStack, highlights, sortOrder } =
    validateProjectInput(input)

  if (techStack === null || highlights === null || sortOrder === null) {
    return {
      ok: false,
      message: "请检查项目表单",
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
      message: "请检查项目表单",
      fieldErrors,
    }
  }

  try {
    const row = await createProject(
      normalizeProjectInput(input, techStack, highlights, sortOrder)
    )
    const project = rowToProject(row)

    await writeAuditLog({
      adminUserId: admin.id,
      action: "project.create",
      entityType: "project",
      entityId: project.id,
      metadata: {
        resume_slug: project.resumeSlug,
        project_slug: project.slug,
        project_name: project.name,
        is_featured: project.isFeatured,
      },
      context,
    })

    return {
      ok: true,
      project,
      message: `已创建项目「${project.name}」`,
    }
  } catch (error) {
    if (hasDatabaseCode(error, "23505")) {
      return projectUniqueSlugError()
    }

    if (hasDatabaseCode(error, "23503")) {
      return projectForeignKeyError()
    }

    return {
      ok: false,
      message: "保存失败，请稍后重试",
    }
  }
}

export async function updateManagedProject(
  projectId: string,
  input: ProjectInput,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<ProjectMutationResult> {
  const { fieldErrors, techStack, highlights, sortOrder } =
    validateProjectInput(input)

  if (techStack === null || highlights === null || sortOrder === null) {
    return {
      ok: false,
      message: "请检查项目表单",
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
      message: "请检查项目表单",
      fieldErrors,
    }
  }

  try {
    const row = await updateProject(
      projectId,
      normalizeProjectInput(input, techStack, highlights, sortOrder)
    )

    if (!row) {
      return {
        ok: false,
        message: "项目不存在或已被删除",
      }
    }

    const project = rowToProject(row)

    await writeAuditLog({
      adminUserId: admin.id,
      action: "project.update",
      entityType: "project",
      entityId: project.id,
      metadata: {
        resume_slug: project.resumeSlug,
        project_slug: project.slug,
        project_name: project.name,
        is_featured: project.isFeatured,
      },
      context,
    })

    return {
      ok: true,
      project,
      message: `已保存项目「${project.name}」`,
    }
  } catch (error) {
    if (hasDatabaseCode(error, "23505")) {
      return projectUniqueSlugError()
    }

    if (hasDatabaseCode(error, "23503")) {
      return projectForeignKeyError()
    }

    return {
      ok: false,
      message: "保存失败，请稍后重试",
    }
  }
}

export async function deleteManagedProject(
  projectId: string,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<DeleteProjectResult> {
  const project = await findProjectById(projectId)

  if (!project) {
    return {
      ok: false,
      message: "项目不存在或已被删除",
    }
  }

  const deleted = await deleteProject(projectId)

  if (!deleted) {
    return {
      ok: false,
      message: "项目不存在或已被删除",
    }
  }

  await writeAuditLog({
    adminUserId: admin.id,
    action: "project.delete",
    entityType: "project",
    entityId: project.id,
    metadata: {
      resume_slug: project.resume_slug,
      project_slug: project.slug,
      project_name: project.name,
    },
    context,
  })

  return {
    ok: true,
    message: `已删除项目「${project.name}」`,
  }
}
