"use server"

import { revalidatePath } from "next/cache"

import { assertAdminRole, requireAdmin } from "@/lib/auth/guards"
import { getRequestAuditContext } from "@/lib/http/request-context"
import {
  createManagedCertification,
  deleteManagedCertification,
  getCertifications,
  getResumeReferences,
  updateManagedCertification,
  type CertificationFieldErrors,
  type CertificationInput,
  type CertificationRecord,
  type ResumeReference,
} from "@/lib/services/certifications-service"

const MANAGE_CERTIFICATION_ROLES = ["owner", "editor"] as const

export type CertificationFormValues = CertificationInput

export type CertificationFormState = {
  message: string
  success?: boolean
  resetKey?: number
  values?: CertificationFormValues
  fieldErrors?: CertificationFieldErrors
}

export type DeleteCertificationFormState = {
  message: string
  success?: boolean
}

export type CertificationsPageData =
  | {
      accessDenied: false
      resumes: ResumeReference[]
      certifications: CertificationRecord[]
    }
  | {
      accessDenied: true
      resumes: []
      certifications: []
    }

function readString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

function readCertificationFormValues(
  formData: FormData
): CertificationFormValues {
  return {
    resumeId: readString(formData.get("resumeId")),
    title: readString(formData.get("title")),
    issuer: readString(formData.get("issuer")),
    issuedOn: readString(formData.get("issuedOn")),
    credentialUrl: readString(formData.get("credentialUrl")),
    sortOrder: readString(formData.get("sortOrder")) || "0",
    isVisible: formData.get("isVisible") === "on",
  }
}

async function requireCertificationManager() {
  const admin = await requireAdmin()
  assertAdminRole(admin.role, MANAGE_CERTIFICATION_ROLES)
  return admin
}

function toFormState(
  result: Awaited<ReturnType<typeof createManagedCertification>>,
  values: CertificationFormValues
): CertificationFormState {
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

export async function getCertificationsPageData(): Promise<CertificationsPageData> {
  const admin = await requireAdmin()

  if (admin.role !== "owner" && admin.role !== "editor") {
    return {
      accessDenied: true,
      resumes: [],
      certifications: [],
    }
  }

  const [resumes, certifications] = await Promise.all([
    getResumeReferences(),
    getCertifications(),
  ])

  return {
    accessDenied: false,
    resumes,
    certifications,
  }
}

export async function createCertificationAction(
  _prevState: CertificationFormState,
  formData: FormData
): Promise<CertificationFormState> {
  const admin = await requireCertificationManager()
  const values = readCertificationFormValues(formData)
  const context = await getRequestAuditContext()
  const result = await createManagedCertification(values, admin, context)

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/certifications")
  }

  return toFormState(result, values)
}

export async function updateCertificationAction(
  certificationId: string,
  _prevState: CertificationFormState,
  formData: FormData
): Promise<CertificationFormState> {
  const admin = await requireCertificationManager()
  const values = readCertificationFormValues(formData)
  const context = await getRequestAuditContext()
  const result = await updateManagedCertification(
    certificationId,
    values,
    admin,
    context
  )

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/certifications")
  }

  return toFormState(result, values)
}

export async function deleteCertificationAction(
  certificationId: string,
  _prevState: DeleteCertificationFormState,
  _formData: FormData
): Promise<DeleteCertificationFormState> {
  void _prevState
  void _formData
  const admin = await requireCertificationManager()
  const context = await getRequestAuditContext()
  const result = await deleteManagedCertification(
    certificationId,
    admin,
    context
  )

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/certifications")
  }

  return {
    message: result.message,
    success: result.ok,
  }
}
