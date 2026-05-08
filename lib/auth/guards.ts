import { redirect } from "next/navigation"

import type { AdminRole } from "@/lib/auth/constants"
import { getCurrentAdmin } from "@/lib/auth/session"

export async function requireAdmin() {
  const admin = await getCurrentAdmin()

  if (!admin) {
    redirect("/login")
  }

  return admin
}

export function assertAdminRole(
  role: AdminRole,
  allowedRoles: readonly AdminRole[]
) {
  if (!allowedRoles.includes(role)) {
    throw new Error("Forbidden")
  }
}
