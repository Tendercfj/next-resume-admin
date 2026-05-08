import {
  ADMIN_ROLES,
  LOGIN_ERROR_MESSAGE,
  SESSION_MAX_AGE_SECONDS,
  type AdminRole,
} from "@/lib/auth/constants"
import {
  createSessionToken,
  hashIdentifier,
  sha256Hex,
} from "@/lib/auth/crypto"
import {
  findAdminUserForLogin,
  recordAdminLoginFailure,
  resetAdminLoginState,
  type AdminLoginRecord,
} from "@/lib/dao/admin-users-dao"
import {
  createAdminSession,
  findActiveAdminBySessionTokenHash,
  revokeAdminSessionByTokenHash,
  touchAdminSession,
} from "@/lib/dao/admin-sessions-dao"
import {
  writeAuditLog,
  type RequestAuditContext,
} from "@/lib/services/admin-audit-service"

export type CurrentAdmin = {
  id: string
  email: string
  displayName: string
  role: AdminRole
  sessionId: string
}

export type LoginAdminResult =
  | {
      ok: true
      token: string
      expiresAt: Date
    }
  | {
      ok: false
      message: string
    }

type LoginAdminInput = {
  email: string
  password: string
  context: RequestAuditContext
}

function isAdminRole(role: string): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole)
}

function isLocked(lockedUntil: string | Date | null) {
  return lockedUntil ? new Date(lockedUntil).getTime() > Date.now() : false
}

async function recordFailedLogin(
  user: AdminLoginRecord | null,
  email: string,
  reason: string,
  context: RequestAuditContext
) {
  if (user) {
    await recordAdminLoginFailure(user.id)
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

export function getSessionExpiresAt() {
  return new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)
}

export async function loginAdmin({
  email,
  password,
  context,
}: LoginAdminInput): Promise<LoginAdminResult> {
  const user = await findAdminUserForLogin(email, password)

  if (!user) {
    await recordFailedLogin(null, email, "unknown_account", context)
    return { ok: false, message: LOGIN_ERROR_MESSAGE }
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
    return { ok: false, message: LOGIN_ERROR_MESSAGE }
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
    return { ok: false, message: LOGIN_ERROR_MESSAGE }
  }

  if (!user.password_matches) {
    await recordFailedLogin(user, email, "invalid_password", context)
    return { ok: false, message: LOGIN_ERROR_MESSAGE }
  }

  const token = createSessionToken()
  const expiresAt = getSessionExpiresAt()

  await resetAdminLoginState(user.id)
  await createAdminSession({
    adminUserId: user.id,
    sessionTokenHash: sha256Hex(token),
    ipHash: context.ipHash,
    userAgent: context.userAgent,
    expiresAt,
  })
  await writeAuditLog({
    adminUserId: user.id,
    action: "admin.login.success",
    metadata: {
      role: user.role,
    },
    context,
  })

  return {
    ok: true,
    token,
    expiresAt,
  }
}

export async function getCurrentAdminBySessionToken(
  token: string
): Promise<CurrentAdmin | null> {
  const row = await findActiveAdminBySessionTokenHash(sha256Hex(token))

  if (!row || !isAdminRole(row.role)) {
    return null
  }

  await touchAdminSession(row.session_id)

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    sessionId: row.session_id,
  }
}

export async function revokeAdminSessionByToken(token: string) {
  return revokeAdminSessionByTokenHash(sha256Hex(token))
}

export async function recordAdminLogout(
  adminUserId: string,
  context: RequestAuditContext
) {
  await writeAuditLog({
    adminUserId,
    action: "admin.logout",
    context,
  })
}
