import { getSql } from "@/lib/db"

export type ActiveAdminSessionRecord = {
  session_id: string
  id: string
  email: string
  display_name: string
  role: string
}

type CreateAdminSessionInput = {
  adminUserId: string
  sessionTokenHash: string
  ipHash: string | null
  userAgent: string | null
  expiresAt: Date
}

export async function createAdminSession({
  adminUserId,
  sessionTokenHash,
  ipHash,
  userAgent,
  expiresAt,
}: CreateAdminSessionInput) {
  const sql = getSql()

  await sql.query(
    `
      INSERT INTO admin_sessions (
        admin_user_id,
        session_token_hash,
        ip_hash,
        user_agent,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5)
    `,
    [adminUserId, sessionTokenHash, ipHash, userAgent, expiresAt.toISOString()]
  )
}

export async function findActiveAdminBySessionTokenHash(
  sessionTokenHash: string
): Promise<ActiveAdminSessionRecord | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      SELECT
        admin_sessions.id AS session_id,
        admin_users.id,
        admin_users.email,
        admin_users.display_name,
        admin_users.role
      FROM admin_sessions
      INNER JOIN admin_users
        ON admin_users.id = admin_sessions.admin_user_id
      WHERE admin_sessions.session_token_hash = $1
        AND admin_sessions.revoked_at IS NULL
        AND admin_sessions.expires_at > now()
        AND admin_users.is_active = true
      LIMIT 1
    `,
    [sessionTokenHash]
  )) as ActiveAdminSessionRecord[]

  return rows[0] ?? null
}

export async function touchAdminSession(sessionId: string) {
  const sql = getSql()

  await sql.query(
    `
      UPDATE admin_sessions
      SET last_seen_at = now()
      WHERE id = $1
    `,
    [sessionId]
  )
}

export async function revokeAdminSessionByTokenHash(
  sessionTokenHash: string
): Promise<string | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      UPDATE admin_sessions
      SET revoked_at = now()
      WHERE session_token_hash = $1
        AND revoked_at IS NULL
      RETURNING admin_user_id
    `,
    [sessionTokenHash]
  )) as Array<{ admin_user_id: string }>

  return rows[0]?.admin_user_id ?? null
}
