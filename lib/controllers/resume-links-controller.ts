"use server"

import { revalidatePath } from "next/cache"

import { assertAdminRole, requireAdmin } from "@/lib/auth/guards"
import { getRequestAuditContext } from "@/lib/http/request-context"
import {
  createManagedResumeLink,
  deleteManagedResumeLink,
  getResumeLinks,
  getResumeReferences,
  updateManagedResumeLink,
  type ResumeLink,
  type ResumeLinkFieldErrors,
  type ResumeLinkInput,
  type ResumeReference,
} from "@/lib/services/resume-links-service"

const MANAGE_LINK_ROLES = ["owner", "editor"] as const

export type ResumeLinkFormValues = ResumeLinkInput

export type ResumeLinkFormState = {
  message: string
  success?: boolean
  resetKey?: number
  values?: ResumeLinkFormValues
  fieldErrors?: ResumeLinkFieldErrors
}

export type DeleteResumeLinkFormState = {
  message: string
  success?: boolean
}

export type ResumeLinksPageData =
  | {
      accessDenied: false
      resumes: ResumeReference[]
      links: ResumeLink[]
    }
  | {
      accessDenied: true
      resumes: []
      links: []
    }

function readString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

function readResumeLinkFormValues(formData: FormData): ResumeLinkFormValues {
  return {
    resumeId: readString(formData.get("resumeId")),
    label: readString(formData.get("label")),
    url: readString(formData.get("url")),
    icon: readString(formData.get("icon")),
    sortOrder: readString(formData.get("sortOrder")) || "0",
    isVisible: formData.get("isVisible") === "on",
  }
}

async function requireLinkManager() {
  const admin = await requireAdmin()
  assertAdminRole(admin.role, MANAGE_LINK_ROLES)
  return admin
}

function toFormState(
  result: Awaited<ReturnType<typeof createManagedResumeLink>>,
  values: ResumeLinkFormValues
): ResumeLinkFormState {
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

export async function getResumeLinksPageData(): Promise<ResumeLinksPageData> {
  const admin = await requireAdmin()

  if (admin.role !== "owner" && admin.role !== "editor") {
    return {
      accessDenied: true,
      resumes: [],
      links: [],
    }
  }

  const [resumes, links] = await Promise.all([getResumeReferences(), getResumeLinks()])

  return {
    accessDenied: false,
    resumes,
    links,
  }
}

export async function createResumeLinkAction(
  _prevState: ResumeLinkFormState,
  formData: FormData
): Promise<ResumeLinkFormState> {
  const admin = await requireLinkManager()
  const values = readResumeLinkFormValues(formData)
  const context = await getRequestAuditContext()
  const result = await createManagedResumeLink(values, admin, context)

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/links")
  }

  return toFormState(result, values)
}

export async function updateResumeLinkAction(
  linkId: string,
  _prevState: ResumeLinkFormState,
  formData: FormData
): Promise<ResumeLinkFormState> {
  const admin = await requireLinkManager()
  const values = readResumeLinkFormValues(formData)
  const context = await getRequestAuditContext()
  const result = await updateManagedResumeLink(linkId, values, admin, context)

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/links")
  }

  return toFormState(result, values)
}

export async function deleteResumeLinkAction(
  linkId: string,
  _prevState: DeleteResumeLinkFormState,
  _formData: FormData
): Promise<DeleteResumeLinkFormState> {
  void _prevState
  void _formData
  const admin = await requireLinkManager()
  const context = await getRequestAuditContext()
  const result = await deleteManagedResumeLink(linkId, admin, context)

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/links")
  }

  return {
    message: result.message,
    success: result.ok,
  }
}
