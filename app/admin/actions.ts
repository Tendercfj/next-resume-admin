"use server"

import { redirect } from "next/navigation"

import { getRequestAuditContext, writeAuditLog } from "@/lib/admin/audit"
import { revokeCurrentAdminSession } from "@/lib/auth/session"

export async function logoutAction() {
  const context = await getRequestAuditContext()
  const adminUserId = await revokeCurrentAdminSession()

  if (adminUserId) {
    await writeAuditLog({
      adminUserId,
      action: "admin.logout",
      context,
    })
  }

  redirect("/login")
}
