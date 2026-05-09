import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

function Badge({
  children,
  className,
}: {
  children: ReactNode
  className: string
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  )
}

export function VisibilityBadge({ isVisible }: { isVisible: boolean }) {
  return (
    <Badge
      className={
        isVisible
          ? "border-primary/25 bg-primary/10 text-primary"
          : "border-border bg-muted text-muted-foreground"
      }
    >
      {isVisible ? "显示中" : "已隐藏"}
    </Badge>
  )
}

export function PublishBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <Badge
      className={
        isPublished
          ? "border-primary/25 bg-primary/10 text-primary"
          : "border-border bg-muted text-muted-foreground"
      }
    >
      {isPublished ? "已发布" : "草稿"}
    </Badge>
  )
}

export function MessageStatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; className: string }> = {
    new: {
      label: "待处理",
      className: "border-primary/25 bg-primary/10 text-primary",
    },
    read: {
      label: "已读",
      className: "border-sky-500/25 bg-sky-500/10 text-sky-700",
    },
    replied: {
      label: "已回复",
      className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700",
    },
    archived: {
      label: "已归档",
      className: "border-border bg-muted text-muted-foreground",
    },
    spam: {
      label: "垃圾消息",
      className: "border-destructive/20 bg-destructive/10 text-destructive",
    },
  }

  const config = statusMap[status] ?? {
    label: status,
    className: "border-border bg-muted text-muted-foreground",
  }

  return <Badge className={config.className}>{config.label}</Badge>
}
