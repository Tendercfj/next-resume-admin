import { cookies } from "next/headers"

import { ADMIN_SESSION_COOKIE } from "@/lib/auth/constants"
import {
  getCurrentAdminBySessionToken,
  revokeAdminSessionByToken,
  type CurrentAdmin,
} from "@/lib/services/admin-auth-service"

export type { CurrentAdmin }

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

  return getCurrentAdminBySessionToken(token)
}

export async function revokeCurrentAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  if (!token) {
    cookieStore.delete(ADMIN_SESSION_COOKIE)
    return null
  }

  const adminUserId = await revokeAdminSessionByToken(token)

  cookieStore.delete(ADMIN_SESSION_COOKIE)

  return adminUserId
}
