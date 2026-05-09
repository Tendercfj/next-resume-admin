"use server"

import { revalidatePath } from "next/cache"

import { assertAdminRole, requireAdmin } from "@/lib/auth/guards"
import { getRequestAuditContext } from "@/lib/http/request-context"
import {
  createManagedProject,
  deleteManagedProject,
  getProjects,
  getResumeReferences,
  updateManagedProject,
  type ProjectFieldErrors,
  type ProjectInput,
  type ProjectRecord,
  type ResumeReference,
} from "@/lib/services/projects-service"

const MANAGE_PROJECT_ROLES = ["owner", "editor"] as const

export type ProjectFormValues = ProjectInput

export type ProjectFormState = {
  message: string
  success?: boolean
  resetKey?: number
  values?: ProjectFormValues
  fieldErrors?: ProjectFieldErrors
}

export type DeleteProjectFormState = {
  message: string
  success?: boolean
}

export type ProjectsPageData =
  | {
      accessDenied: false
      resumes: ResumeReference[]
      projects: ProjectRecord[]
    }
  | {
      accessDenied: true
      resumes: []
      projects: []
    }

function readString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

function readProjectFormValues(formData: FormData): ProjectFormValues {
  return {
    resumeId: readString(formData.get("resumeId")),
    slug: readString(formData.get("slug")).toLowerCase(),
    name: readString(formData.get("name")),
    role: readString(formData.get("role")),
    description: readString(formData.get("description")),
    techStackText: readString(formData.get("techStackText")),
    highlightsText: readString(formData.get("highlightsText")),
    projectUrl: readString(formData.get("projectUrl")),
    sourceUrl: readString(formData.get("sourceUrl")),
    startDate: readString(formData.get("startDate")),
    endDate: readString(formData.get("endDate")),
    isFeatured: formData.get("isFeatured") === "on",
    sortOrder: readString(formData.get("sortOrder")) || "0",
    isVisible: formData.get("isVisible") === "on",
  }
}

async function requireProjectManager() {
  const admin = await requireAdmin()
  assertAdminRole(admin.role, MANAGE_PROJECT_ROLES)
  return admin
}

function toFormState(
  result: Awaited<ReturnType<typeof createManagedProject>>,
  values: ProjectFormValues
): ProjectFormState {
  if (!result.ok) {
    return {
      message: result.message,
      success: false,
      values,
      fieldErrors: result.fieldErrors,
    }
  }

  return {
    message: result.message,
    success: true,
    resetKey: Date.now(),
  }
}

export async function getProjectsPageData(): Promise<ProjectsPageData> {
  const admin = await requireAdmin()

  if (admin.role !== "owner" && admin.role !== "editor") {
    return {
      accessDenied: true,
      resumes: [],
      projects: [],
    }
  }

  const [resumes, projects] = await Promise.all([
    getResumeReferences(),
    getProjects(),
  ])

  return {
    accessDenied: false,
    resumes,
    projects,
  }
}

export async function createProjectAction(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const admin = await requireProjectManager()
  const values = readProjectFormValues(formData)
  const context = await getRequestAuditContext()
  const result = await createManagedProject(values, admin, context)

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/projects")
  }

  return toFormState(result, values)
}

export async function updateProjectAction(
  projectId: string,
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const admin = await requireProjectManager()
  const values = readProjectFormValues(formData)
  const context = await getRequestAuditContext()
  const result = await updateManagedProject(projectId, values, admin, context)

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/projects")
  }

  return toFormState(result, values)
}

export async function deleteProjectAction(
  projectId: string,
  _prevState: DeleteProjectFormState,
  _formData: FormData
): Promise<DeleteProjectFormState> {
  void _prevState
  void _formData
  const admin = await requireProjectManager()
  const context = await getRequestAuditContext()
  const result = await deleteManagedProject(projectId, admin, context)

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/projects")
  }

  return {
    message: result.message,
    success: result.ok,
  }
}
