import {
  ArrowLeftIcon,
  GraduationCapIcon,
  PencilLineIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import Link from "next/link"

import { AccessDeniedState } from "@/components/admin/access-denied-state"
import {
  PublishBadge,
  VisibilityBadge,
} from "@/components/admin/admin-badges"
import { EducationDeleteForm } from "@/components/admin/education-delete-form"
import { EducationForm } from "@/components/admin/education-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDateRange, formatDateTime } from "@/lib/admin/formatters"
import { getAdminSection } from "@/lib/admin/sections"
import { getEducationPageData } from "@/lib/controllers/education-controller"
import type {
  EducationRecord,
  ResumeReference,
} from "@/lib/services/education-service"

function EducationCard({
  education,
  resumes,
}: {
  education: EducationRecord
  resumes: ResumeReference[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="min-w-0 truncate">{education.school}</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          {education.degree ? <span>{education.degree}</span> : null}
          {education.major ? <span>{education.major}</span> : null}
          <span className="font-mono text-xs">{education.resumeSlug}</span>
        </CardDescription>
        <CardAction>
          <VisibilityBadge isVisible={education.isVisible} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <PublishBadge isPublished={education.resumeIsPublished} />
          <span className="text-sm text-muted-foreground">
            {education.resumeTitle}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">时间范围</p>
            <p className="mt-1 text-sm font-medium">
              {formatDateRange(education.startDate, education.endDate)}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">地点</p>
            <p className="mt-1 text-sm font-medium">
              {education.location || "未设置"}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">排序</p>
            <p className="mt-1 text-sm font-medium">{education.sortOrder}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">更新于</p>
            <p className="mt-1 text-sm font-medium">
              {formatDateTime(education.updatedAt)}
            </p>
          </div>
        </div>

        {education.description ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {education.description}
          </p>
        ) : null}

        <details className="group rounded-lg border bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <span className="flex min-w-0 items-center gap-2">
              <PencilLineIcon
                className="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="truncate">编辑教育</span>
            </span>
            <span className="text-xs text-muted-foreground group-open:hidden">
              展开
            </span>
            <span className="hidden text-xs text-muted-foreground group-open:inline">
              收起
            </span>
          </summary>
          <div className="border-t p-3">
            <EducationForm mode="edit" education={education} resumes={resumes} />
          </div>
        </details>

        <details className="group rounded-lg border bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <span className="flex min-w-0 items-center gap-2">
              <Trash2Icon
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
            <EducationDeleteForm educationId={education.id} />
          </div>
        </details>
      </CardContent>
    </Card>
  )
}

export default async function AdminEducationPage() {
  const section = getAdminSection("education")
  const data = await getEducationPageData()

  if (data.accessDenied) {
    return (
      <AccessDeniedState
        title="无法访问教育经历"
        description="当前账号没有维护 education 的权限。"
      />
    )
  }

  const resumes = data.resumes
  const educationRecords = data.educationRecords
  const visibleCount = educationRecords.filter((item) => item.isVisible).length
  const Icon = section?.icon ?? GraduationCapIcon

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
              {section?.title ?? "教育经历"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              维护 education，管理学校、学位、专业、时间范围和描述。
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
            <a href="#new-education">
              <PlusIcon data-icon="inline-start" />
              新建教育
            </a>
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle>教育总数</CardTitle>
            <CardDescription className="text-2xl font-semibold text-foreground">
              {educationRecords.length}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>显示中</CardTitle>
            <CardDescription className="text-2xl font-semibold text-foreground">
              {visibleCount}
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      {resumes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>尚未创建简历资料</CardTitle>
            <CardDescription>
              教育经历需要关联到某一份 resumes 主档。请先创建资料，再回来维护教育信息。
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <section className="flex min-w-0 flex-col gap-4">
            {educationRecords.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>还没有教育经历</CardTitle>
                  <CardDescription>
                    添加学校、学位、专业和时间范围，补全简历教育背景。
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            {educationRecords.map((education) => (
              <EducationCard
                key={education.id}
                education={education}
                resumes={resumes}
              />
            ))}
          </section>

          <aside className="flex flex-col gap-4" id="new-education">
            <Card>
              <CardHeader>
                <CardTitle>新建教育经历</CardTitle>
                <CardDescription>
                  添加一条新的教育背景记录，并控制公开展示状态。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EducationForm mode="create" resumes={resumes} />
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </main>
  )
}
