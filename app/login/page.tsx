import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ShieldCheckIcon } from "lucide-react"

import { LoginForm } from "@/app/login/login-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getCurrentAdmin } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: "登录 | Resume Admin",
  description: "next-resume-admin 后台登录",
}

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[]
  }>
}

function getSafeNextPath(next: string | string[] | undefined) {
  const nextPath = Array.isArray(next) ? next[0] : next

  if (!nextPath || nextPath.startsWith("//") || !nextPath.startsWith("/admin")) {
    return "/admin"
  }

  return nextPath
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams
  const nextPath = getSafeNextPath(next)
  const admin = await getCurrentAdmin()

  if (admin) {
    redirect(nextPath)
  }

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto grid min-h-dvh w-full max-w-6xl grid-cols-1 items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_420px] lg:px-10">
        <section className="flex w-full min-w-0 max-w-2xl flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg border bg-card text-primary shadow-sm">
              <ShieldCheckIcon className="size-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-muted-foreground">
                next-resume-admin
              </p>
              <p className="font-heading text-lg font-semibold">
                Resume Admin
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="max-w-xl text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
              简历内容管理后台
            </h1>
            <p className="w-full max-w-lg text-base leading-7 text-muted-foreground">
              使用受保护的管理员会话进入控制台，维护简历资料并处理访客消息。
            </p>
          </div>

          <div className="grid w-full max-w-xl grid-cols-1 gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="min-w-0 rounded-lg border bg-card p-3">
              <p className="font-medium text-foreground">Credentials</p>
              <p>自建会话</p>
            </div>
            <div className="min-w-0 rounded-lg border bg-card p-3">
              <p className="font-medium text-foreground">Neon</p>
              <p>服务端校验</p>
            </div>
            <div className="min-w-0 rounded-lg border bg-card p-3">
              <p className="font-medium text-foreground">Audit</p>
              <p>关键动作记录</p>
            </div>
          </div>
        </section>

        <Card className="w-full min-w-0 shadow-sm">
          <CardHeader>
            <CardTitle>登录</CardTitle>
            <CardDescription>请输入管理员邮箱和密码</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm nextPath={nextPath} />
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              连续失败 5 次后将临时锁定 15 分钟。
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
