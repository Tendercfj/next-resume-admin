"use server"

import { revalidatePath } from "next/cache"

import { assertAdminRole, requireAdmin } from "@/lib/auth/guards"
import { getRequestAuditContext } from "@/lib/http/request-context"
import {
  createManagedWorkExperience,
  deleteManagedWorkExperience,
  getResumeReferences,
  getWorkExperiences,
  updateManagedWorkExperience,
  type ResumeReference,
  type WorkExperience,
  type WorkExperienceFieldErrors,
  type WorkExperienceInput,
} from "@/lib/services/work-experiences-service"

const MANAGE_WORK_ROLES = ["owner", "editor"] as const

export type WorkExperienceFormValues = WorkExperienceInput

export type WorkExperienceFormState = {
  message: string
  success?: boolean
  resetKey?: number
  values?: WorkExperienceFormValues
  fieldErrors?: WorkExperienceFieldErrors
}

export type DeleteWorkExperienceFormState = {
  message: string
  success?: boolean
}

export type WorkPageData =
  | {
      accessDenied: false
      resumes: ResumeReference[]
      workExperiences: WorkExperience[]
    }
  | {
      accessDenied: true
      resumes: []
      workExperiences: []
    }

function readString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

function readWorkExperienceFormValues(
  formData: FormData
): WorkExperienceFormValues {
  return {
    resumeId: readString(formData.get("resumeId")),
    company: readString(formData.get("company")),
    role: readString(formData.get("role")),
    location: readString(formData.get("location")),
    employmentType: readString(formData.get("employmentType")),
    startDate: readString(formData.get("startDate")),
    endDate: readString(formData.get("endDate")),
    isCurrent: formData.get("isCurrent") === "on",
    summary: readString(formData.get("summary")),
    highlightsText: readString(formData.get("highlightsText")),
    sortOrder: readString(formData.get("sortOrder")) || "0",
    isVisible: formData.get("isVisible") === "on",
  }
}

async function requireWorkManager() {
  const admin = await requireAdmin()
  assertAdminRole(admin.role, MANAGE_WORK_ROLES)
  return admin
}

function toFormState(
  result: Awaited<ReturnType<typeof createManagedWorkExperience>>,
  values: WorkExperienceFormValues
): WorkExperienceFormState {
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

export async function getWorkPageData(): Promise<WorkPageData> {
  const admin = await requireAdmin()

  if (admin.role !== "owner" && admin.role !== "editor") {
    return {
      accessDenied: true,
      resumes: [],
      workExperiences: [],
    }
  }

  const [resumes, workExperiences] = await Promise.all([
    getResumeReferences(),
    getWorkExperiences(),
  ])

  return {
    accessDenied: false,
    resumes,
    workExperiences,
  }
}

export async function createWorkExperienceAction(
  _prevState: WorkExperienceFormState,
  formData: FormData
): Promise<WorkExperienceFormState> {
  const admin = await requireWorkManager()
  const values = readWorkExperienceFormValues(formData)
  const context = await getRequestAuditContext()
  const result = await createManagedWorkExperience(values, admin, context)

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/work")
  }

  return toFormState(result, values)
}

export async function updateWorkExperienceAction(
  workExperienceId: string,
  _prevState: WorkExperienceFormState,
  formData: FormData
): Promise<WorkExperienceFormState> {
  const admin = await requireWorkManager()
  const values = readWorkExperienceFormValues(formData)
  const context = await getRequestAuditContext()
  const result = await updateManagedWorkExperience(
    workExperienceId,
    values,
    admin,
    context
  )

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/work")
  }

  return toFormState(result, values)
}

export async function deleteWorkExperienceAction(
  workExperienceId: string,
  _prevState: DeleteWorkExperienceFormState,
  _formData: FormData
): Promise<DeleteWorkExperienceFormState> {
  void _prevState
  void _formData
  const admin = await requireWorkManager()
  const context = await getRequestAuditContext()
  const result = await deleteManagedWorkExperience(
    workExperienceId,
    admin,
    context
  )

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/work")
  }

  return {
    message: result.message,
    success: result.ok,
  }
}
