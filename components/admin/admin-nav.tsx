"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { ADMIN_NAV_ITEMS } from "@/lib/admin/sections"
import { cn } from "@/lib/utils"

type AdminNavProps = {
  variant: "sidebar" | "mobile"
}

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminNav({ variant }: AdminNavProps) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="后台导航"
      className={cn(
        variant === "sidebar"
          ? "flex flex-col gap-1 px-3 py-3"
          : "flex gap-2 overflow-x-auto px-4 py-2"
      )}
    >
      {ADMIN_NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active = isActivePath(pathname, item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex min-w-0 items-center gap-2 rounded-lg text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              variant === "sidebar"
                ? "px-2.5 py-2"
                : "shrink-0 border px-3 py-1.5",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {variant === "sidebar" ? item.title : item.shortTitle}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
