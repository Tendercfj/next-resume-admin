"use server"

import { revalidatePath } from "next/cache"

import { assertAdminRole, requireAdmin } from "@/lib/auth/guards"
import { getRequestAuditContext } from "@/lib/http/request-context"
import {
  createResumeProfile,
  deleteResumeProfile,
  getResumeProfiles,
  updateResumeProfile,
  type ResumeProfile,
  type ResumeProfileFieldErrors,
  type ResumeProfileInput,
} from "@/lib/services/resumes-service"

const MANAGE_RESUME_ROLES = ["owner", "editor"] as const

export type ResumeFormValues = ResumeProfileInput

export type ResumeFormState = {
  message: string
  success?: boolean
  resetKey?: number
  values?: ResumeFormValues
  fieldErrors?: ResumeProfileFieldErrors
}

export type DeleteResumeFormState = {
  message: string
  success?: boolean
  fieldErrors?: {
    confirmSlug?: string
  }
}

export type ResumeProfilePageData =
  | {
      accessDenied: false
      resumes: ResumeProfile[]
    }
  | {
      accessDenied: true
      resumes: []
    }

function readString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

function readResumeFormValues(formData: FormData): ResumeFormValues {
  return {
    slug: readString(formData.get("slug")).toLowerCase(),
    locale: readString(formData.get("locale")) || "zh-CN",
    title: readString(formData.get("title")),
    ownerName: readString(formData.get("ownerName")),
    headline: readString(formData.get("headline")),
    summary: readString(formData.get("summary")),
    avatarUrl: readString(formData.get("avatarUrl")),
    location: readString(formData.get("location")),
    email: readString(formData.get("email")).toLowerCase(),
    phone: readString(formData.get("phone")),
    websiteUrl: readString(formData.get("websiteUrl")),
    githubUrl: readString(formData.get("githubUrl")),
    linkedinUrl: readString(formData.get("linkedinUrl")),
    isPublished: formData.get("isPublished") === "on",
  }
}

async function requireResumeManager() {
  const admin = await requireAdmin()
  assertAdminRole(admin.role, MANAGE_RESUME_ROLES)
  return admin
}

function toFormState(
  result: Awaited<ReturnType<typeof createResumeProfile>>,
  values: ResumeFormValues
): ResumeFormState {
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

export async function getResumeProfilePageData(): Promise<ResumeProfilePageData> {
  const admin = await requireAdmin()

  if (admin.role !== "owner" && admin.role !== "editor") {
    return {
      accessDenied: true,
      resumes: [],
    }
  }

  const resumes = await getResumeProfiles()

  return {
    accessDenied: false,
    resumes,
  }
}

export async function createResumeAction(
  _prevState: ResumeFormState,
  formData: FormData
): Promise<ResumeFormState> {
  const admin = await requireResumeManager()
  const values = readResumeFormValues(formData)
  const context = await getRequestAuditContext()
  const result = await createResumeProfile(values, admin, context)

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/profile")
  }

  return toFormState(result, values)
}

export async function updateResumeAction(
  resumeId: string,
  _prevState: ResumeFormState,
  formData: FormData
): Promise<ResumeFormState> {
  const admin = await requireResumeManager()
  const values = readResumeFormValues(formData)
  const context = await getRequestAuditContext()
  const result = await updateResumeProfile(resumeId, values, admin, context)

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/profile")
  }

  return toFormState(result, values)
}

export async function deleteResumeAction(
  resumeId: string,
  _prevState: DeleteResumeFormState,
  formData: FormData
): Promise<DeleteResumeFormState> {
  const admin = await requireResumeManager()
  const confirmSlug = readString(formData.get("confirmSlug"))
  const context = await getRequestAuditContext()
  const result = await deleteResumeProfile(resumeId, confirmSlug, admin, context)

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/profile")
  }

  return {
    message: result.message,
    success: result.ok,
    fieldErrors: result.ok ? undefined : result.fieldErrors,
  }
}
