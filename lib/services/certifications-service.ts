import type { CurrentAdmin } from "@/lib/auth/session"
import {
  createCertificationRecord,
  deleteCertificationRecord,
  findCertificationById,
  listCertifications,
  updateCertificationRecord,
  type CertificationRow,
  type CertificationWriteInput,
} from "@/lib/dao/certifications-dao"
import {
  getResumeReferenceMap,
  getResumeReferences,
  hasDatabaseCode,
  normalizeDateInput,
  optionalText,
  parseSortOrder,
  toDateInputString,
  toIsoString,
  type ResumeReference,
  validateOptionalDate,
  validateOptionalText,
  validateRequiredText,
  validateUrl,
} from "@/lib/services/admin-content-shared"
import {
  writeAuditLog,
  type RequestAuditContext,
} from "@/lib/services/admin-audit-service"

export type CertificationRecord = {
  id: string
  resumeId: string
  resumeSlug: string
  resumeTitle: string
  resumeOwnerName: string
  resumeIsPublished: boolean
  title: string
  issuer: string
  issuedOn: string
  credentialUrl: string
  sortOrder: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export type CertificationInput = {
  resumeId: string
  title: string
  issuer: string
  issuedOn: string
  credentialUrl: string
  sortOrder: string
  isVisible: boolean
}

export type CertificationFieldErrors = Partial<
  Record<keyof CertificationInput, string>
>

export type CertificationMutationResult =
  | {
      ok: true
      certification: CertificationRecord
      message: string
    }
  | {
      ok: false
      message: string
      fieldErrors?: CertificationFieldErrors
    }

export type DeleteCertificationResult =
  | {
      ok: true
      message: string
    }
  | {
      ok: false
      message: string
    }

function rowToCertification(row: CertificationRow): CertificationRecord {
  return {
    id: row.id,
    resumeId: row.resume_id,
    resumeSlug: row.resume_slug,
    resumeTitle: row.resume_title,
    resumeOwnerName: row.resume_owner_name,
    resumeIsPublished: row.resume_is_published,
    title: row.title,
    issuer: row.issuer ?? "",
    issuedOn: toDateInputString(row.issued_on),
    credentialUrl: row.credential_url ?? "",
    sortOrder: row.sort_order,
    isVisible: row.is_visible,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  }
}

function validateCertificationInput(input: CertificationInput) {
  const fieldErrors: CertificationFieldErrors = {}

  validateRequiredText(fieldErrors, "resumeId", input.resumeId, "关联资料", 100)
  validateRequiredText(fieldErrors, "title", input.title, "证书名称", 160)
  validateOptionalText(fieldErrors, "issuer", input.issuer, "颁发机构", 160)
  validateOptionalDate(fieldErrors, "issuedOn", input.issuedOn, "颁发日期")
  validateUrl(fieldErrors, "credentialUrl", input.credentialUrl, "凭证链接")
  const sortOrder = parseSortOrder(fieldErrors, "sortOrder", input.sortOrder)

  return {
    fieldErrors,
    sortOrder,
  }
}

function normalizeCertificationInput(
  input: CertificationInput,
  sortOrder: number
): CertificationWriteInput {
  return {
    resumeId: input.resumeId.trim(),
    title: input.title.trim(),
    issuer: optionalText(input.issuer),
    issuedOn: normalizeDateInput(input.issuedOn),
    credentialUrl: optionalText(input.credentialUrl),
    sortOrder,
    isVisible: input.isVisible,
  }
}

function certificationForeignKeyError(): CertificationMutationResult {
  return {
    ok: false,
    message: "关联资料不存在，请刷新后重试",
    fieldErrors: {
      resumeId: "请选择有效的简历资料",
    },
  }
}

export { getResumeReferences, type ResumeReference }

export async function getCertifications() {
  const rows = await listCertifications()
  return rows.map(rowToCertification)
}

export async function createManagedCertification(
  input: CertificationInput,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<CertificationMutationResult> {
  const { fieldErrors, sortOrder } = validateCertificationInput(input)

  if (sortOrder === null) {
    return {
      ok: false,
      message: "请检查证书表单",
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
      message: "请检查证书表单",
      fieldErrors,
    }
  }

  try {
    const row = await createCertificationRecord(
      normalizeCertificationInput(input, sortOrder)
    )
    const certification = rowToCertification(row)

    await writeAuditLog({
      adminUserId: admin.id,
      action: "certification.create",
      entityType: "certification",
      entityId: certification.id,
      metadata: {
        resume_slug: certification.resumeSlug,
        title: certification.title,
        issuer: certification.issuer || null,
      },
      context,
    })

    return {
      ok: true,
      certification,
      message: `已创建证书「${certification.title}」`,
    }
  } catch (error) {
    if (hasDatabaseCode(error, "23503")) {
      return certificationForeignKeyError()
    }

    return {
      ok: false,
      message: "保存失败，请稍后重试",
    }
  }
}

export async function updateManagedCertification(
  certificationId: string,
  input: CertificationInput,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<CertificationMutationResult> {
  const { fieldErrors, sortOrder } = validateCertificationInput(input)

  if (sortOrder === null) {
    return {
      ok: false,
      message: "请检查证书表单",
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
      message: "请检查证书表单",
      fieldErrors,
    }
  }

  try {
    const row = await updateCertificationRecord(
      certificationId,
      normalizeCertificationInput(input, sortOrder)
    )

    if (!row) {
      return {
        ok: false,
        message: "证书不存在或已被删除",
      }
    }

    const certification = rowToCertification(row)

    await writeAuditLog({
      adminUserId: admin.id,
      action: "certification.update",
      entityType: "certification",
      entityId: certification.id,
      metadata: {
        resume_slug: certification.resumeSlug,
        title: certification.title,
        issuer: certification.issuer || null,
      },
      context,
    })

    return {
      ok: true,
      certification,
      message: `已保存证书「${certification.title}」`,
    }
  } catch (error) {
    if (hasDatabaseCode(error, "23503")) {
      return certificationForeignKeyError()
    }

    return {
      ok: false,
      message: "保存失败，请稍后重试",
    }
  }
}

export async function deleteManagedCertification(
  certificationId: string,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<DeleteCertificationResult> {
  const certification = await findCertificationById(certificationId)

  if (!certification) {
    return {
      ok: false,
      message: "证书不存在或已被删除",
    }
  }

  const deleted = await deleteCertificationRecord(certificationId)

  if (!deleted) {
    return {
      ok: false,
      message: "证书不存在或已被删除",
    }
  }

  await writeAuditLog({
    adminUserId: admin.id,
    action: "certification.delete",
    entityType: "certification",
    entityId: certification.id,
    metadata: {
      resume_slug: certification.resume_slug,
      title: certification.title,
      issuer: certification.issuer,
    },
    context,
  })

  return {
    ok: true,
    message: `已删除证书「${certification.title}」`,
  }
}
