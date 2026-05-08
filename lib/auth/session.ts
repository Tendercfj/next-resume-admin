import { cookies } from "next/headers"

import {
  ADMIN_ROLES,
  ADMIN_SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  type AdminRole,
} from "@/lib/auth/constants"
import { sha256Hex } from "@/lib/auth/crypto"
import { getSql } from "@/lib/db"

export type CurrentAdmin = {
  id: string
  email: string
  displayName: string
  role: AdminRole
  sessionId: string
}

type AdminSessionRow = {
  session_id: string
  id: string
  email: string
  display_name: string
  role: string
}

function isAdminRole(role: string): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole)
}

export function getSessionExpiresAt() {
  return new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)
}

export async function setAdminSessionCookie(token: string, expires: Date) {
  const cookieStore = await cookies()

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  })
}

export async function deleteAdminSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_SESSION_COOKIE)
}

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value

  if (!token) {
    return null
  }

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
    [sha256Hex(token)]
  )) as AdminSessionRow[]

  const row = rows[0]

  if (!row || !isAdminRole(row.role)) {
    return null
  }

  await sql.query(
    `
      UPDATE admin_sessions
      SET last_seen_at = now()
      WHERE id = $1
    `,
    [row.session_id]
  )

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    sessionId: row.session_id,
  }
}

export async function revokeCurrentAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  if (!token) {
    cookieStore.delete(ADMIN_SESSION_COOKIE)
    return null
  }

  const sql = getSql()
  const rows = (await sql.query(
    `
      UPDATE admin_sessions
      SET revoked_at = now()
      WHERE session_token_hash = $1
        AND revoked_at IS NULL
      RETURNING admin_user_id
    `,
    [sha256Hex(token)]
  )) as Array<{ admin_user_id: string }>

  cookieStore.delete(ADMIN_SESSION_COOKIE)

  return rows[0]?.admin_user_id ?? null
}
