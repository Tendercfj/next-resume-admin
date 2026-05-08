import Link from "next/link"
import { ArrowRightIcon, CheckCircle2Icon } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ADMIN_HOME_ITEM,
  ADMIN_SECTION_ITEMS,
} from "@/lib/admin/sections"

const highlights = [
  {
    title: "登录接口",
    description: "Credentials Session、Cookie 和审计链路已接入。",
  },
  {
    title: "受保护入口",
    description: "后台布局通过 requireAdmin() 做服务端会话校验。",
  },
  {
    title: "模块壳子",
    description: "内容管理、经历、项目和消息模块路由已初始化。",
  },
]

export default function AdminPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">控制台</p>
        <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
          {ADMIN_HOME_ITEM.title}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          登录、会话、退出和后台导航已连通。下一步可以逐个接入简历内容表单、消息列表和审计视图。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <CheckCircle2Icon className="size-4" aria-hidden="true" />
                已初始化
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold">管理模块</h2>
          <p className="text-sm text-muted-foreground">8 个入口</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ADMIN_SECTION_ITEMS.map((section) => {
            const Icon = section.icon

            return (
              <Card key={section.href} className="transition-colors hover:bg-muted/30">
                <CardHeader>
                  <div className="mb-2 flex size-9 items-center justify-center rounded-lg border bg-background text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                  <CardAction>
                    <span className="rounded-md border bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {section.status === "ready" ? "可用" : "待接入"}
                    </span>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <Link
                    href={section.href}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    打开模块
                    <ArrowRightIcon className="size-3.5" aria-hidden="true" />
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </main>
  )
}
