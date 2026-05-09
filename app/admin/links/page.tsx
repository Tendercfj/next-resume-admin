import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  LinkIcon,
  PencilLineIcon,
  PlusIcon,
  ShieldAlertIcon,
  Trash2Icon,
} from "lucide-react"
import Link from "next/link"

import { ResumeLinkDeleteForm } from "@/components/admin/resume-link-delete-form"
import { ResumeLinkForm } from "@/components/admin/resume-link-form"
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
import { getResumeLinksPageData } from "@/lib/controllers/resume-links-controller"
import type {
  ResumeLink as ResumeLinkRecord,
  ResumeReference,
} from "@/lib/services/resume-links-service"
import { cn } from "@/lib/utils"

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function VisibilityBadge({ isVisible }: { isVisible: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        isVisible
          ? "border-primary/25 bg-primary/10 text-primary"
          : "border-border bg-muted text-muted-foreground"
      )}
    >
      {isVisible ? "显示中" : "已隐藏"}
    </span>
  )
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
              无法访问链接管理
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              当前账号没有维护 resume_links 的权限。
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

function LinkCard({
  link,
  resumes,
}: {
  link: ResumeLinkRecord
  resumes: ResumeReference[]
}) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex flex-col gap-3 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="truncate font-medium">{link.label}</p>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex max-w-full items-center gap-1 text-sm text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="truncate">{link.url}</span>
              <ExternalLinkIcon className="size-3.5 shrink-0" aria-hidden="true" />
            </a>
          </div>
          <VisibilityBadge isVisible={link.isVisible} />
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-3">
          <div className="rounded-md border bg-muted/30 px-2.5 py-2">
            <p className="text-xs font-medium">排序</p>
            <p className="mt-1 font-medium text-foreground">{link.sortOrder}</p>
          </div>
          <div className="rounded-md border bg-muted/30 px-2.5 py-2">
            <p className="text-xs font-medium">图标键</p>
            <p className="mt-1 truncate font-medium text-foreground">
              {link.icon || "未设置"}
            </p>
          </div>
          <div className="rounded-md border bg-muted/30 px-2.5 py-2">
            <p className="text-xs font-medium">更新于</p>
            <p className="mt-1 font-medium text-foreground">
              {formatDateTime(link.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t px-3 py-3">
        <div className="flex flex-col gap-3">
          <details className="group rounded-lg border bg-card">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <span className="flex min-w-0 items-center gap-2">
                <PencilLineIcon
                  className="size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="truncate">编辑链接</span>
              </span>
              <span className="text-xs text-muted-foreground group-open:hidden">
                展开
              </span>
              <span className="hidden text-xs text-muted-foreground group-open:inline">
                收起
              </span>
            </summary>
            <div className="border-t p-3">
              <ResumeLinkForm mode="edit" link={link} resumes={resumes} />
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
              <ResumeLinkDeleteForm linkId={link.id} />
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}

function ResumeLinksSection({
  resume,
  links,
  resumes,
}: {
  resume: ResumeReference
  links: ResumeLinkRecord[]
  resumes: ResumeReference[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="min-w-0 truncate">{resume.title}</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <span>{resume.ownerName}</span>
          <span className="font-mono text-xs">{resume.slug}</span>
        </CardDescription>
        <CardAction>
          <PublishBadge isPublished={resume.isPublished} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">链接数量</p>
            <p className="mt-1 font-medium">{links.length}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">显示中</p>
            <p className="mt-1 font-medium">
              {links.filter((link) => link.isVisible).length}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">隐藏中</p>
            <p className="mt-1 font-medium">
              {links.filter((link) => !link.isVisible).length}
            </p>
          </div>
        </div>

        {links.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
            这份资料还没有链接。可以在右侧新建一个社交或作品入口。
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <LinkCard key={link.id} link={link} resumes={resumes} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default async function AdminLinksPage() {
  const section = getAdminSection("links")
  const data = await getResumeLinksPageData()

  if (data.accessDenied) {
    return <AccessDeniedState />
  }

  const resumes = data.resumes
  const links = data.links
  const linksByResumeId = new Map<string, ResumeLinkRecord[]>()

  for (const link of links) {
    const group = linksByResumeId.get(link.resumeId) ?? []
    group.push(link)
    linksByResumeId.set(link.resumeId, group)
  }

  const visibleCount = links.filter((link) => link.isVisible).length
  const hiddenCount = links.length - visibleCount
  const resumeCountWithLinks = resumes.filter((resume) =>
    linksByResumeId.has(resume.id)
  ).length
  const Icon = section?.icon ?? LinkIcon

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
              {section?.title ?? "链接管理"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              维护 resume_links，集中管理站点、社交账号和作品入口的排序与展示状态。
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
            <a href="#new-link">
              <PlusIcon data-icon="inline-start" />
              新建链接
            </a>
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>链接总数</CardTitle>
            <CardDescription className="text-2xl font-semibold text-foreground">
              {links.length}
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
        <Card size="sm">
          <CardHeader>
            <CardTitle>已配置资料</CardTitle>
            <CardDescription className="text-2xl font-semibold text-foreground">
              {resumeCountWithLinks} / {resumes.length}
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      {resumes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>尚未创建简历资料</CardTitle>
            <CardDescription>
              链接需要关联到某一份 resumes 主档。请先在资料模块创建主档，再回来维护链接。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link href="/admin/profile">
                <ArrowLeftIcon data-icon="inline-start" />
                前往资料模块
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_25rem]">
          <section className="flex min-w-0 flex-col gap-4">
            {links.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>还没有任何链接</CardTitle>
                  <CardDescription>
                    先添加公开站点、GitHub、LinkedIn 或作品页面，再按排序控制前台展示顺序。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        已隐藏
                      </p>
                      <p className="mt-1 font-medium">{hiddenCount}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        可关联资料
                      </p>
                      <p className="mt-1 font-medium">{resumes.length}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        默认排序
                      </p>
                      <p className="mt-1 font-medium">数值越小越靠前</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {resumes.map((resume) => (
              <ResumeLinksSection
                key={resume.id}
                resume={resume}
                links={linksByResumeId.get(resume.id) ?? []}
                resumes={resumes}
              />
            ))}
          </section>

          <aside className="flex flex-col gap-4" id="new-link">
            <Card>
              <CardHeader>
                <CardTitle>新建链接</CardTitle>
                <CardDescription>
                  添加一个新的公开入口，并指定所属资料、图标键和排序。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResumeLinkForm mode="create" resumes={resumes} />
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </main>
  )
}
