import type { ReactNode } from "react"
import { LogOutIcon, ShieldCheckIcon } from "lucide-react"

import { logoutAction } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { requireAdmin } from "@/lib/auth/guards"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin()

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-primary">
              <ShieldCheckIcon className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-semibold">
                Resume Admin
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {admin.displayName} · {admin.role}
              </p>
            </div>
          </div>

          <form action={logoutAction}>
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
      </header>
      {children}
    </div>
  )
}
