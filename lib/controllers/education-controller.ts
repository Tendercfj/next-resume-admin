"use server"

import { revalidatePath } from "next/cache"

import { assertAdminRole, requireAdmin } from "@/lib/auth/guards"
import { getRequestAuditContext } from "@/lib/http/request-context"
import {
  createManagedEducation,
  deleteManagedEducation,
  getEducationRecords,
  getResumeReferences,
  updateManagedEducation,
  type EducationFieldErrors,
  type EducationInput,
  type EducationRecord,
  type ResumeReference,
} from "@/lib/services/education-service"

const MANAGE_EDUCATION_ROLES = ["owner", "editor"] as const

export type EducationFormValues = EducationInput

export type EducationFormState = {
  message: string
  success?: boolean
  resetKey?: number
  values?: EducationFormValues
  fieldErrors?: EducationFieldErrors
}

export type DeleteEducationFormState = {
  message: string
  success?: boolean
}

export type EducationPageData =
  | {
      accessDenied: false
      resumes: ResumeReference[]
      educationRecords: EducationRecord[]
    }
  | {
      accessDenied: true
      resumes: []
      educationRecords: []
    }

function readString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

function readEducationFormValues(formData: FormData): EducationFormValues {
  return {
    resumeId: readString(formData.get("resumeId")),
    school: readString(formData.get("school")),
    degree: readString(formData.get("degree")),
    major: readString(formData.get("major")),
    location: readString(formData.get("location")),
    startDate: readString(formData.get("startDate")),
    endDate: readString(formData.get("endDate")),
    description: readString(formData.get("description")),
    sortOrder: readString(formData.get("sortOrder")) || "0",
    isVisible: formData.get("isVisible") === "on",
  }
}

async function requireEducationManager() {
  const admin = await requireAdmin()
  assertAdminRole(admin.role, MANAGE_EDUCATION_ROLES)
  return admin
}

function toFormState(
  result: Awaited<ReturnType<typeof createManagedEducation>>,
  values: EducationFormValues
): EducationFormState {
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

export async function getEducationPageData(): Promise<EducationPageData> {
  const admin = await requireAdmin()

  if (admin.role !== "owner" && admin.role !== "editor") {
    return {
      accessDenied: true,
      resumes: [],
      educationRecords: [],
    }
  }

  const [resumes, educationRecords] = await Promise.all([
    getResumeReferences(),
    getEducationRecords(),
  ])

  return {
    accessDenied: false,
    resumes,
    educationRecords,
  }
}

export async function createEducationAction(
  _prevState: EducationFormState,
  formData: FormData
): Promise<EducationFormState> {
  const admin = await requireEducationManager()
  const values = readEducationFormValues(formData)
  const context = await getRequestAuditContext()
  const result = await createManagedEducation(values, admin, context)

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/education")
  }

  return toFormState(result, values)
}

export async function updateEducationAction(
  educationId: string,
  _prevState: EducationFormState,
  formData: FormData
): Promise<EducationFormState> {
  const admin = await requireEducationManager()
  const values = readEducationFormValues(formData)
  const context = await getRequestAuditContext()
  const result = await updateManagedEducation(educationId, values, admin, context)

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/education")
  }

  return toFormState(result, values)
}

export async function deleteEducationAction(
  educationId: string,
  _prevState: DeleteEducationFormState,
  _formData: FormData
): Promise<DeleteEducationFormState> {
  void _prevState
  void _formData
  const admin = await requireEducationManager()
  const context = await getRequestAuditContext()
  const result = await deleteManagedEducation(educationId, admin, context)

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/education")
  }

  return {
    message: result.message,
    success: result.ok,
  }
}
