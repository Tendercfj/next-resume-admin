"use server"

import { redirect } from "next/navigation"

import { getRequestAuditContext, writeAuditLog } from "@/lib/admin/audit"
import { LOGIN_ERROR_MESSAGE } from "@/lib/auth/constants"
import {
  createSessionToken,
  hashIdentifier,
  sha256Hex,
} from "@/lib/auth/crypto"
import { getSessionExpiresAt, setAdminSessionCookie } from "@/lib/auth/session"
import { getSql } from "@/lib/db"

export type LoginFormState = {
  message: string
  fieldErrors?: {
    email?: string
    password?: string
  }
}

type AdminLoginRow = {
  id: string
  email: string
  display_name: string
  role: string
  is_active: boolean
  failed_login_attempts: number
  locked_until: string | Date | null
  password_matches: boolean
}

function readString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

function validateLoginForm(formData: FormData) {
  const email = readString(formData.get("email")).toLowerCase()
  const password = readString(formData.get("password"))
  const fieldErrors: LoginFormState["fieldErrors"] = {}

  if (!email) {
    fieldErrors.email = "请输入管理员邮箱"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "请输入有效的邮箱地址"
  }

  if (!password) {
    fieldErrors.password = "请输入密码"
  } else if (password.length > 256) {
    fieldErrors.password = "密码长度不正确"
  }

  return {
    email,
    password,
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  }
}

function isLocked(lockedUntil: string | Date | null) {
  return lockedUntil ? new Date(lockedUntil).getTime() > Date.now() : false
}

async function recordFailedLogin(
  user: AdminLoginRow | undefined,
  email: string,
  reason: string
) {
  const sql = getSql()
  const context = await getRequestAuditContext()

  if (user) {
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
      [user.id]
    )
  }

  await writeAuditLog({
    adminUserId: user?.id ?? null,
    action: "admin.login.failed",
    metadata: {
      email_hash: hashIdentifier(email),
      reason,
    },
    context,
  })
}

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const { email, password, fieldErrors, isValid } = validateLoginForm(formData)

  if (!isValid) {
    return {
      message: "请检查邮箱和密码",
      fieldErrors,
    }
  }

  let shouldRedirect = false

  try {
    const sql = getSql()
    const context = await getRequestAuditContext()
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
    )) as AdminLoginRow[]

    const user = rows[0]

    if (!user) {
      await recordFailedLogin(undefined, email, "unknown_account")
      return { message: LOGIN_ERROR_MESSAGE }
    }

    if (!user.is_active) {
      await writeAuditLog({
        adminUserId: user.id,
        action: "admin.login.failed",
        metadata: {
          email_hash: hashIdentifier(email),
          reason: "inactive_account",
        },
        context,
      })
      return { message: LOGIN_ERROR_MESSAGE }
    }

    if (isLocked(user.locked_until)) {
      await writeAuditLog({
        adminUserId: user.id,
        action: "admin.login.failed",
        metadata: {
          email_hash: hashIdentifier(email),
          reason: "locked_account",
        },
        context,
      })
      return { message: LOGIN_ERROR_MESSAGE }
    }

    if (!user.password_matches) {
      await recordFailedLogin(user, email, "invalid_password")
      return { message: LOGIN_ERROR_MESSAGE }
    }

    const token = createSessionToken()
    const expiresAt = getSessionExpiresAt()

    await sql.query(
      `
        UPDATE admin_users
        SET
          failed_login_attempts = 0,
          locked_until = NULL,
          last_login_at = now()
        WHERE id = $1
      `,
      [user.id]
    )

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
      [
        user.id,
        sha256Hex(token),
        context.ipHash,
        context.userAgent,
        expiresAt.toISOString(),
      ]
    )

    await writeAuditLog({
      adminUserId: user.id,
      action: "admin.login.success",
      metadata: {
        role: user.role,
      },
      context,
    })

    await setAdminSessionCookie(token, expiresAt)
    shouldRedirect = true
  } catch {
    return {
      message: "登录暂时不可用，请稍后再试",
    }
  }

  if (shouldRedirect) {
    redirect("/admin")
  }

  return {
    message: "登录暂时不可用，请稍后再试",
  }
}
