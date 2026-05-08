import { getSql } from "@/lib/db"

export type AuditMetadata = Record<
  string,
  string | number | boolean | null | undefined
>

type CreateAdminAuditLogInput = {
  adminUserId: string | null
  action: string
  entityType: string | null
  entityId: string | null
  metadata: AuditMetadata
  ipHash: string | null
  userAgent: string | null
}

export async function createAdminAuditLog({
  adminUserId,
  action,
  entityType,
  entityId,
  metadata,
  ipHash,
  userAgent,
}: CreateAdminAuditLogInput) {
  const sql = getSql()

  await sql.query(
    `
      INSERT INTO admin_audit_logs (
        admin_user_id,
        action,
        entity_type,
        entity_id,
        metadata,
        ip_hash,
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
    `,
    [
      adminUserId,
      action,
      entityType,
      entityId,
      JSON.stringify(metadata),
      ipHash,
      userAgent,
    ]
  )
}
