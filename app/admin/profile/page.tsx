import {
  ArrowLeftIcon,
  FileTextIcon,
  PencilLineIcon,
  PlusIcon,
  ShieldAlertIcon,
} from "lucide-react"
import Link from "next/link"

import { ResumeDeleteForm } from "@/components/admin/resume-delete-form"
import { ResumeProfileForm } from "@/components/admin/resume-profile-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getAdminSection } from "@/lib/admin/sections"
import { getResumeProfilePageData } from "@/lib/controllers/resumes-controller"
import type { ResumeProfile } from "@/lib/services/resumes-service"
import { cn } from "@/lib/utils"

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function PublishBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        isPublished
          ? "border-primary/25 bg-primary/10 text-primary"
          : "border-border bg-muted text-muted-foreground"
      )}
    >
      {isPublished ? "已发布" : "草稿"}
    </span>
  )
}

function ResumeSummary({ resume }: { resume: ResumeProfile }) {
  const summary = resume.summary || resume.headline || "未填写简介"

  return (
    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="text-xs font-medium text-muted-foreground">Slug</p>
        <p className="mt-1 truncate font-medium">{resume.slug}</p>
      </div>
      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="text-xs font-medium text-muted-foreground">语言</p>
        <p className="mt-1 truncate font-medium">{resume.locale}</p>
      </div>
      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="text-xs font-medium text-muted-foreground">更新于</p>
        <p className="mt-1 truncate font-medium">
          {formatDateTime(resume.updatedAt)}
        </p>
      </div>
      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="text-xs font-medium text-muted-foreground">状态</p>
        <div className="mt-1">
          <PublishBadge isPublished={resume.isPublished} />
        </div>
      </div>
      <p className="sm:col-span-2 xl:col-span-4 line-clamp-3 text-muted-foreground">
        {summary}
      </p>
    </div>
  )
}

function AccessDeniedState() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-card text-destructive">
            <ShieldAlertIcon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">权限不足</p>
            <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
              无法访问简历资料
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              当前账号没有维护 resumes 主档的权限。
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
    </main>
  )
}

export default async function AdminProfilePage() {
  const section = getAdminSection("profile")
  const data = await getResumeProfilePageData()

  if (data.accessDenied) {
    return <AccessDeniedState />
  }

  const resumes = data.resumes
  const publishedCount = resumes.filter((resume) => resume.isPublished).length
  const draftCount = resumes.length - publishedCount
  const Icon = section?.icon ?? FileTextIcon

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
              {section?.title ?? "简历资料"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              维护 resumes 主档，包括展示基础信息、公开状态、联系入口和个人简介。
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin">
              <ArrowLeftIcon data-icon="inline-start" />
              返回控制台
            </Link>
          </Button>
          <Button asChild size="sm">
            <a href="#new-resume">
              <PlusIcon data-icon="inline-start" />
              新建资料
            </a>
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>总资料</CardTitle>
            <CardDescription className="text-2xl font-semibold text-foreground">
              {resumes.length}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>已发布</CardTitle>
            <CardDescription className="text-2xl font-semibold text-foreground">
              {publishedCount}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>草稿</CardTitle>
            <CardDescription className="text-2xl font-semibold text-foreground">
              {draftCount}
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <section className="flex min-w-0 flex-col gap-4">
          {resumes.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>暂无简历资料</CardTitle>
                <CardDescription>
                  创建第一份主档后，其他内容模块可以关联到这份简历。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm">
                  <a href="#new-resume">
                    <PlusIcon data-icon="inline-start" />
                    创建资料
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            resumes.map((resume) => (
              <Card key={resume.id}>
                <CardHeader>
                  <CardTitle className="min-w-0 truncate">
                    {resume.title}
                  </CardTitle>
                  <CardDescription className="min-w-0 truncate">
                    {resume.ownerName}
                    {resume.headline ? ` · ${resume.headline}` : ""}
                  </CardDescription>
                  <CardAction>
                    <PublishBadge isPublished={resume.isPublished} />
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <ResumeSummary resume={resume} />

                  <details className="group rounded-lg border bg-card">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                      <span className="flex min-w-0 items-center gap-2">
                        <PencilLineIcon
                          className="size-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span className="truncate">编辑资料</span>
                      </span>
                      <span className="text-xs text-muted-foreground group-open:hidden">
                        展开
                      </span>
                      <span className="hidden text-xs text-muted-foreground group-open:inline">
                        收起
                      </span>
                    </summary>
                    <div className="border-t p-3">
                      <ResumeProfileForm mode="edit" resume={resume} />
                    </div>
                  </details>

                  <details className="group rounded-lg border bg-card">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                      <span className="flex min-w-0 items-center gap-2">
                        <ShieldAlertIcon
                          className="size-4 shrink-0 text-destructive"
                          aria-hidden="true"
                        />
                        <span className="truncate">危险操作</span>
                      </span>
                      <span className="text-xs text-muted-foreground group-open:hidden">
                        展开
                      </span>
                      <span className="hidden text-xs text-muted-foreground group-open:inline">
                        收起
                      </span>
                    </summary>
                    <div className="border-t p-3">
                      <ResumeDeleteForm resumeId={resume.id} slug={resume.slug} />
                    </div>
                  </details>
                </CardContent>
              </Card>
            ))
          )}
        </section>

        <aside id="new-resume" className="min-w-0 scroll-mt-20">
          <Card className="xl:sticky xl:top-20">
            <CardHeader>
              <CardTitle>新建资料</CardTitle>
              <CardDescription>
                创建 resumes 主档，用于承载公开简历的基础信息。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResumeProfileForm mode="create" />
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  )
}
