import {
  ArrowLeftIcon,
  BriefcaseBusinessIcon,
  Building2Icon,
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
import { WorkExperienceDeleteForm } from "@/components/admin/work-experience-delete-form"
import { WorkExperienceForm } from "@/components/admin/work-experience-form"
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
import { formatDateRange, formatDateTime } from "@/lib/admin/formatters"
import { getWorkPageData } from "@/lib/controllers/work-experiences-controller"
import type {
  ResumeReference,
  WorkExperience,
} from "@/lib/services/work-experiences-service"

const employmentTypeLabels: Record<string, string> = {
  full_time: "全职",
  part_time: "兼职",
  contract: "合同",
  internship: "实习",
  freelance: "自由职业",
}

function WorkExperienceCard({
  workExperience,
  resumes,
}: {
  workExperience: WorkExperience
  resumes: ResumeReference[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="min-w-0 truncate">
          {workExperience.company}
        </CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <span>{workExperience.role}</span>
          <span className="font-mono text-xs">{workExperience.resumeSlug}</span>
        </CardDescription>
        <CardAction>
          <VisibilityBadge isVisible={workExperience.isVisible} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <PublishBadge isPublished={workExperience.resumeIsPublished} />
          <span className="text-sm text-muted-foreground">
            {workExperience.resumeTitle}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">时间范围</p>
            <p className="mt-1 text-sm font-medium">
              {formatDateRange(
                workExperience.startDate,
                workExperience.endDate,
                {
                  currentLabel: workExperience.isCurrent ? "至今" : "未设置",
                }
              )}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">雇佣类型</p>
            <p className="mt-1 text-sm font-medium">
              {workExperience.employmentType
                ? employmentTypeLabels[workExperience.employmentType]
                : "未设置"}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">工作地点</p>
            <p className="mt-1 text-sm font-medium">
              {workExperience.location || "未设置"}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">更新于</p>
            <p className="mt-1 text-sm font-medium">
              {formatDateTime(workExperience.updatedAt)}
            </p>
          </div>
        </div>

        {workExperience.summary ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {workExperience.summary}
          </p>
        ) : null}

        {workExperience.highlights.length > 0 ? (
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3">
            <p className="text-sm font-medium">工作亮点</p>
            <ul className="grid gap-2 text-sm text-muted-foreground">
              {workExperience.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <details className="group rounded-lg border bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <span className="flex min-w-0 items-center gap-2">
              <PencilLineIcon
                className="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="truncate">编辑经历</span>
            </span>
            <span className="text-xs text-muted-foreground group-open:hidden">
              展开
            </span>
            <span className="hidden text-xs text-muted-foreground group-open:inline">
              收起
            </span>
          </summary>
          <div className="border-t p-3">
            <WorkExperienceForm
              mode="edit"
              workExperience={workExperience}
              resumes={resumes}
            />
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
            <WorkExperienceDeleteForm workExperienceId={workExperience.id} />
          </div>
        </details>
      </CardContent>
    </Card>
  )
}

export default async function AdminWorkPage() {
  const section = getAdminSection("work")
  const data = await getWorkPageData()

  if (data.accessDenied) {
    return (
      <AccessDeniedState
        title="无法访问工作经历"
        description="当前账号没有维护 work_experiences 的权限。"
      />
    )
  }

  const resumes = data.resumes
  const workExperiences = data.workExperiences
  const currentCount = workExperiences.filter((item) => item.isCurrent).length
  const visibleCount = workExperiences.filter((item) => item.isVisible).length
  const Icon = section?.icon ?? BriefcaseBusinessIcon

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
              {section?.title ?? "工作经历"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              维护 work_experiences，管理公司、职位、时间线和工作亮点。
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
            <a href="#new-work-experience">
              <PlusIcon data-icon="inline-start" />
              新建经历
            </a>
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>经历总数</CardTitle>
            <CardDescription className="text-2xl font-semibold text-foreground">
              {workExperiences.length}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>当前任职</CardTitle>
            <CardDescription className="text-2xl font-semibold text-foreground">
              {currentCount}
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
              工作经历需要关联到某一份 resumes 主档。请先创建资料，再回来维护经历。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link href="/admin/profile">
                <Building2Icon data-icon="inline-start" />
                前往资料模块
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <section className="flex min-w-0 flex-col gap-4">
            {workExperiences.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>还没有工作经历</CardTitle>
                  <CardDescription>
                    先添加一段经历，再逐步补充时间线、概述和工作亮点。
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            {workExperiences.map((workExperience) => (
              <WorkExperienceCard
                key={workExperience.id}
                workExperience={workExperience}
                resumes={resumes}
              />
            ))}
          </section>

          <aside className="flex flex-col gap-4" id="new-work-experience">
            <Card>
              <CardHeader>
                <CardTitle>新建工作经历</CardTitle>
                <CardDescription>
                  添加一段新的任职经历，支持概述、亮点和可见性控制。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkExperienceForm mode="create" resumes={resumes} />
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </main>
  )
}
