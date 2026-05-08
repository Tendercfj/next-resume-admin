import type { ReactNode } from "react"
import { LogOutIcon, ShieldCheckIcon } from "lucide-react"

import { AdminNav } from "@/components/admin/admin-nav"
import { Button } from "@/components/ui/button"
import type { CurrentAdmin } from "@/lib/auth/session"
import { logoutAction } from "@/lib/controllers/admin-auth-controller"

const roleLabels: Record<CurrentAdmin["role"], string> = {
  owner: "Owner",
  editor: "Editor",
  viewer: "Viewer",
}

type AdminShellProps = {
  admin: CurrentAdmin
  children: ReactNode
}

export function AdminShell({ admin, children }: AdminShellProps) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="flex min-h-dvh">
        <aside className="hidden w-64 shrink-0 border-r bg-sidebar lg:flex lg:flex-col">
          <div className="flex h-16 items-center gap-3 border-b px-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheckIcon className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Resume Admin</p>
              <p className="truncate text-xs text-muted-foreground">
                next-resume 控制台
              </p>
            </div>
          </div>

          <AdminNav variant="sidebar" />

          <div className="mt-auto border-t p-4">
            <p className="truncate text-sm font-medium">{admin.displayName}</p>
            <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-md border bg-background px-1.5 py-0.5 font-medium text-foreground">
                {roleLabels[admin.role]}
              </span>
              <span className="truncate">{admin.email}</span>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
            <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-card text-primary lg:hidden">
                  <ShieldCheckIcon className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    Resume Admin
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {admin.displayName} · {roleLabels[admin.role]}
                  </p>
                </div>
              </div>

              <form action={logoutAction} className="shrink-0">
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                >
                  <LogOutIcon data-icon="inline-start" />
                  退出
                </Button>
              </form>
            </div>

            <div className="border-t lg:hidden">
              <AdminNav variant="mobile" />
            </div>
          </header>

          {children}
        </div>
      </div>
    </div>
  )
}
