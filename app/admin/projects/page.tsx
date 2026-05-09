import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  FolderKanbanIcon,
  PencilLineIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react"
import Link from "next/link"

import { AccessDeniedState } from "@/components/admin/access-denied-state"
import {
  PublishBadge,
  VisibilityBadge,
} from "@/components/admin/admin-badges"
import { ProjectDeleteForm } from "@/components/admin/project-delete-form"
import { ProjectForm } from "@/components/admin/project-form"
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
import { getProjectsPageData } from "@/lib/controllers/projects-controller"
import type { ProjectRecord, ResumeReference } from "@/lib/services/projects-service"

function ProjectCard({
  project,
  resumes,
}: {
  project: ProjectRecord
  resumes: ResumeReference[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="min-w-0 truncate">{project.name}</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs">{project.slug}</span>
          {project.role ? <span>{project.role}</span> : null}
        </CardDescription>
        <CardAction>
          <VisibilityBadge isVisible={project.isVisible} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <PublishBadge isPublished={project.resumeIsPublished} />
          {project.isFeatured ? (
            <span className="inline-flex w-fit items-center gap-1 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700">
              <StarIcon className="size-3" aria-hidden="true" />
              精选项目
            </span>
          ) : null}
          <span className="text-sm text-muted-foreground">
            {project.resumeTitle}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">时间范围</p>
            <p className="mt-1 text-sm font-medium">
              {formatDateRange(project.startDate, project.endDate)}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">排序</p>
            <p className="mt-1 text-sm font-medium">{project.sortOrder}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">资料</p>
            <p className="mt-1 text-sm font-medium">{project.resumeSlug}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">更新于</p>
            <p className="mt-1 text-sm font-medium">
              {formatDateTime(project.updatedAt)}
            </p>
          </div>
        </div>

        {project.description ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {project.description}
          </p>
        ) : null}

        {project.techStack.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <span
                key={tech}
                className="rounded-md border bg-muted/30 px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tech}
              </span>
            ))}
          </div>
        ) : null}

        {project.highlights.length > 0 ? (
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3">
            <p className="text-sm font-medium">项目亮点</p>
            <ul className="grid gap-2 text-sm text-muted-foreground">
              {project.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {project.projectUrl ? (
            <a
              href={project.projectUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              项目链接
              <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
            </a>
          ) : null}
          {project.sourceUrl ? (
            <a
              href={project.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              源码链接
              <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
            </a>
          ) : null}
        </div>

        <details className="group rounded-lg border bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <span className="flex min-w-0 items-center gap-2">
              <PencilLineIcon
                className="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="truncate">编辑项目</span>
            </span>
            <span className="text-xs text-muted-foreground group-open:hidden">
              展开
            </span>
            <span className="hidden text-xs text-muted-foreground group-open:inline">
              收起
            </span>
          </summary>
          <div className="border-t p-3">
            <ProjectForm mode="edit" project={project} resumes={resumes} />
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
            <ProjectDeleteForm projectId={project.id} />
          </div>
        </details>
      </CardContent>
    </Card>
  )
}

export default async function AdminProjectsPage() {
  const section = getAdminSection("projects")
  const data = await getProjectsPageData()

  if (data.accessDenied) {
    return (
      <AccessDeniedState
        title="无法访问项目作品"
        description="当前账号没有维护 projects 的权限。"
      />
    )
  }

  const resumes = data.resumes
  const projects = data.projects
  const featuredCount = projects.filter((project) => project.isFeatured).length
  const visibleCount = projects.filter((project) => project.isVisible).length
  const Icon = section?.icon ?? FolderKanbanIcon

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
              {section?.title ?? "项目作品"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              维护 projects，管理项目链接、技术栈、亮点和精选状态。
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
            <a href="#new-project">
              <PlusIcon data-icon="inline-start" />
              新建项目
            </a>
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>项目总数</CardTitle>
            <CardDescription className="text-2xl font-semibold text-foreground">
              {projects.length}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>精选项目</CardTitle>
            <CardDescription className="text-2xl font-semibold text-foreground">
              {featuredCount}
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
              项目需要关联到某一份 resumes 主档。请先创建资料，再回来维护项目。
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <section className="flex min-w-0 flex-col gap-4">
            {projects.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>还没有项目作品</CardTitle>
                  <CardDescription>
                    先添加一个项目，再继续补充技术栈、亮点和外部链接。
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} resumes={resumes} />
            ))}
          </section>

          <aside className="flex flex-col gap-4" id="new-project">
            <Card>
              <CardHeader>
                <CardTitle>新建项目</CardTitle>
                <CardDescription>
                  添加一个新的项目作品，支持精选标记和多链接维护。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectForm mode="create" resumes={resumes} />
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </main>
  )
}
