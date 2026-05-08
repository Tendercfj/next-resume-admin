import Link from "next/link"
import { ArrowLeftIcon, ClipboardCheckIcon, ShieldCheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getAdminSection,
  type AdminSectionId,
} from "@/lib/admin/sections"

type AdminSectionPlaceholderProps = {
  sectionId: AdminSectionId
}

export function AdminSectionPlaceholder({
  sectionId,
}: AdminSectionPlaceholderProps) {
  const section = getAdminSection(sectionId)

  if (!section) {
    return null
  }

  const Icon = section.icon

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-card text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              管理模块
            </p>
            <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
              {section.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {section.description}
            </p>
          </div>
        </div>

        <Button asChild variant="outline" size="sm" className="w-fit">
          <Link href="/admin">
            <ArrowLeftIcon data-icon="inline-start" />
            返回控制台
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>页面初始化</CardTitle>
            <CardDescription>
              路由、导航和权限说明已就位，业务表单会在后续迭代接入。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="flex items-start gap-3">
                <ClipboardCheckIcon
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">待实现能力</p>
                  <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                    {section.checklist.map((item) => (
                      <li key={item} className="flex min-w-0 items-center gap-2">
                        <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                        <span className="truncate">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>访问策略</CardTitle>
            <CardDescription>
              后续写操作仍需在 Server Action 内重复鉴权和授权。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <ShieldCheckIcon
                className="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium">允许角色</p>
                <p className="truncate text-sm text-muted-foreground">
                  {section.permission}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
