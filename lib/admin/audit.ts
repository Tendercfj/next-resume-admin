import { headers } from "next/headers"

import { getSql } from "@/lib/db"
import { sha256Hex } from "@/lib/auth/crypto"

type AuditMetadata = Record<
  string,
  string | number | boolean | null | undefined
>

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
  context?: RequestAuditContext
}

function compactMetadata(metadata: AuditMetadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined)
  )
}

export async function getRequestAuditContext(): Promise<RequestAuditContext> {
  const headerStore = await headers()
  const forwardedFor = headerStore.get("x-forwarded-for")
  const realIp = headerStore.get("x-real-ip")
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp?.trim()
  const userAgent = headerStore.get("user-agent")?.slice(0, 500) ?? null

  return {
    ipHash: ip ? sha256Hex(ip) : null,
    userAgent,
  }
}

export async function writeAuditLog({
  adminUserId = null,
  action,
  entityType = null,
  entityId = null,
  metadata,
  context,
}: WriteAuditLogInput) {
  const sql = getSql()
  const requestContext = context ?? (await getRequestAuditContext())

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
      JSON.stringify(compactMetadata(metadata)),
      requestContext.ipHash,
      requestContext.userAgent,
    ]
  )
}
