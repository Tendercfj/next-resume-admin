import {
  createAdminAuditLog,
  type AuditMetadata,
} from "@/lib/dao/admin-audit-logs-dao"

export type RequestAuditContext = {
  ipHash: string | null
  userAgent: string | null
}

type WriteAuditLogInput = {
  adminUserId?: string | null
  action: string
  entityType?: string | null
  entityId?: string | null
  metadata?: AuditMetadata
  context: RequestAuditContext
}

function compactMetadata(metadata: AuditMetadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined)
  )
}

export async function writeAuditLog({
  adminUserId = null,
  action,
  entityType = null,
  entityId = null,
  metadata,
  context,
}: WriteAuditLogInput) {
  await createAdminAuditLog({
    adminUserId,
    action,
    entityType,
    entityId,
    metadata: compactMetadata(metadata),
    ipHash: context.ipHash,
    userAgent: context.userAgent,
  })
}
