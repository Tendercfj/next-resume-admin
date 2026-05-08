import type { ReactNode } from "react"

import { AdminShell } from "@/components/admin/admin-shell"
import { requireAdmin } from "@/lib/auth/guards"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin()

  return <AdminShell admin={admin}>{children}</AdminShell>
}
