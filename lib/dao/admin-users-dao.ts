import { getSql } from "@/lib/db"

export type AdminLoginRecord = {
  id: string
  email: string
  display_name: string
  role: string
  is_active: boolean
  failed_login_attempts: number
  locked_until: string | Date | null
  password_matches: boolean
}

export async function findAdminUserForLogin(
  email: string,
  password: string
): Promise<AdminLoginRecord | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      SELECT
        id,
        email,
        display_name,
        role,
        is_active,
        failed_login_attempts,
        locked_until,
        password_hash = crypt($2, password_hash) AS password_matches
      FROM admin_users
      WHERE lower(email) = lower($1)
      LIMIT 1
    `,
    [email, password]
  )) as AdminLoginRecord[]

  return rows[0] ?? null
}

export async function recordAdminLoginFailure(adminUserId: string) {
  const sql = getSql()

  await sql.query(
    `
      UPDATE admin_users
      SET
        failed_login_attempts = CASE
          WHEN locked_until IS NOT NULL AND locked_until <= now() THEN 1
          ELSE failed_login_attempts + 1
        END,
        locked_until = CASE
          WHEN (
            CASE
              WHEN locked_until IS NOT NULL AND locked_until <= now() THEN 1
              ELSE failed_login_attempts + 1
            END
          ) >= 5 THEN now() + interval '15 minutes'
          ELSE NULL
        END
      WHERE id = $1
    `,
    [adminUserId]
  )
}

export async function resetAdminLoginState(adminUserId: string) {
  const sql = getSql()

  await sql.query(
    `
      UPDATE admin_users
      SET
        failed_login_attempts = 0,
        locked_until = NULL,
        last_login_at = now()
      WHERE id = $1
    `,
    [adminUserId]
  )
}
