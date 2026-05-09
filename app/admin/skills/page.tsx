import {
  ArrowLeftIcon,
  ListChecksIcon,
  PencilLineIcon,
  PlusIcon,
  ShieldAlertIcon,
  Trash2Icon,
} from "lucide-react"
import Link from "next/link"

import { SkillGroupDeleteForm } from "@/components/admin/skill-group-delete-form"
import { SkillGroupForm } from "@/components/admin/skill-group-form"
import { SkillItemDeleteForm } from "@/components/admin/skill-item-delete-form"
import { SkillItemForm } from "@/components/admin/skill-item-form"
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
import { getSkillsPageData } from "@/lib/controllers/skills-controller"
import type {
  ResumeReference,
  SkillGroup,
  SkillItem,
  SkillLevel,
} from "@/lib/services/skills-service"
import { cn } from "@/lib/utils"

const skillLevelLabels: Record<SkillLevel, string> = {
  familiar: "熟悉",
  proficient: "熟练",
  expert: "精通",
}

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

function SkillLevelBadge({ level }: { level: SkillItem["level"] }) {
  if (!level) {
    return (
      <span className="inline-flex w-fit items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        未设置
      </span>
    )
  }

  return (
    <span className="inline-flex w-fit items-center rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      {skillLevelLabels[level]}
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
              无法访问技能矩阵
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              当前账号没有维护 skill_groups 和 skill_items 的权限。
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

function SkillItemCard({
  item,
  groupOptions,
}: {
  item: SkillItem
  groupOptions: Array<{ id: string; label: string }>
}) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex flex-col gap-3 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="truncate font-medium">{item.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {item.groupName}
              <span className="mx-1">·</span>
              <span className="font-mono text-xs">{item.resumeSlug}</span>
            </p>
          </div>
          <SkillLevelBadge level={item.level} />
        </div>

        {item.keywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {item.keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-md border bg-muted/30 px-2 py-0.5 text-xs text-muted-foreground"
              >
                {keyword}
              </span>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-3">
          <div className="rounded-md border bg-muted/30 px-2.5 py-2">
            <p className="text-xs font-medium">排序</p>
            <p className="mt-1 font-medium text-foreground">{item.sortOrder}</p>
          </div>
          <div className="rounded-md border bg-muted/30 px-2.5 py-2">
            <p className="text-xs font-medium">状态</p>
            <div className="mt-1">
              <VisibilityBadge isVisible={item.isVisible} />
            </div>
          </div>
          <div className="rounded-md border bg-muted/30 px-2.5 py-2">
            <p className="text-xs font-medium">更新于</p>
            <p className="mt-1 font-medium text-foreground">
              {formatDateTime(item.updatedAt)}
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
                <span className="truncate">编辑技能项</span>
              </span>
              <span className="text-xs text-muted-foreground group-open:hidden">
                展开
              </span>
              <span className="hidden text-xs text-muted-foreground group-open:inline">
                收起
              </span>
            </summary>
            <div className="border-t p-3">
              <SkillItemForm mode="edit" item={item} groupOptions={groupOptions} />
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
              <SkillItemDeleteForm itemId={item.id} />
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}

function SkillGroupCard({
  group,
  groupOptions,
  resumes,
}: {
  group: SkillGroup
  groupOptions: Array<{ id: string; label: string }>
  resumes: ResumeReference[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="min-w-0 truncate">{group.name}</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <span>{group.resumeTitle}</span>
          <span className="font-mono text-xs">{group.resumeSlug}</span>
        </CardDescription>
        <CardAction>
          <VisibilityBadge isVisible={group.isVisible} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <PublishBadge isPublished={group.resumeIsPublished} />
          <span className="text-sm text-muted-foreground">
            {group.resumeOwnerName}
          </span>
        </div>

        {group.description ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {group.description}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">技能项</p>
            <p className="mt-1 font-medium">{group.items.length}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">显示中</p>
            <p className="mt-1 font-medium">
              {group.items.filter((item) => item.isVisible).length}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">排序</p>
            <p className="mt-1 font-medium">{group.sortOrder}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">更新于</p>
            <p className="mt-1 font-medium">{formatDateTime(group.updatedAt)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {group.items.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
              这个分组还没有技能项。可以直接在下面新增一项。
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {group.items.map((item) => (
                <SkillItemCard
                  key={item.id}
                  item={item}
                  groupOptions={groupOptions}
                />
              ))}
            </div>
          )}
        </div>

        <details
          className="group rounded-lg border bg-card"
          id={`group-item-create-${group.id}`}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <span className="flex min-w-0 items-center gap-2">
              <PlusIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate">新增技能项</span>
            </span>
            <span className="text-xs text-muted-foreground group-open:hidden">
              展开
            </span>
            <span className="hidden text-xs text-muted-foreground group-open:inline">
              收起
            </span>
          </summary>
          <div className="border-t p-3">
            <SkillItemForm
              mode="create"
              groupOptions={groupOptions}
              defaultGroupId={group.id}
            />
          </div>
        </details>

        <details className="group rounded-lg border bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <span className="flex min-w-0 items-center gap-2">
              <PencilLineIcon
                className="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="truncate">编辑分组</span>
            </span>
            <span className="text-xs text-muted-foreground group-open:hidden">
              展开
            </span>
            <span className="hidden text-xs text-muted-foreground group-open:inline">
              收起
            </span>
          </summary>
          <div className="border-t p-3">
            <SkillGroupForm mode="edit" group={group} resumes={resumes} />
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
            <SkillGroupDeleteForm groupId={group.id} itemCount={group.items.length} />
          </div>
        </details>
      </CardContent>
    </Card>
  )
}

export default async function AdminSkillsPage() {
  const section = getAdminSection("skills")
  const data = await getSkillsPageData()

  if (data.accessDenied) {
    return <AccessDeniedState />
  }

  const resumes = data.resumes
  const groups = data.groups
  const totalItems = groups.reduce((count, group) => count + group.items.length, 0)
  const visibleGroupCount = groups.filter((group) => group.isVisible).length
  const visibleItemCount = groups.reduce(
    (count, group) => count + group.items.filter((item) => item.isVisible).length,
    0
  )
  const groupOptions = groups.map((group) => ({
    id: group.id,
    label: `${group.name} (${group.resumeSlug})`,
  }))
  const Icon = section?.icon ?? ListChecksIcon

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
              {section?.title ?? "技能矩阵"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              维护 skill_groups 与 skill_items，组织技能分组、关键词、熟练度和公开展示顺序。
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
            <a href="#new-group">
              <PlusIcon data-icon="inline-start" />
              新建分组
            </a>
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle>分组总数</CardTitle>
            <CardDescription className="text-2xl font-semibold text-foreground">
              {groups.length}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>技能项总数</CardTitle>
            <CardDescription className="text-2xl font-semibold text-foreground">
              {totalItems}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>显示中的分组</CardTitle>
            <CardDescription className="text-2xl font-semibold text-foreground">
              {visibleGroupCount}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>显示中的技能项</CardTitle>
            <CardDescription className="text-2xl font-semibold text-foreground">
              {visibleItemCount}
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      {resumes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>尚未创建简历资料</CardTitle>
            <CardDescription>
              技能矩阵需要关联到某一份 resumes 主档。请先创建资料，再维护技能分组与技能项。
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
            {groups.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>还没有技能分组</CardTitle>
                  <CardDescription>
                    先创建一个技能分组，再继续补充技能项、关键词和熟练度。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        可关联资料
                      </p>
                      <p className="mt-1 font-medium">{resumes.length}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        技能项状态
                      </p>
                      <p className="mt-1 font-medium">支持隐藏与公开</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        熟练度
                      </p>
                      <p className="mt-1 font-medium">可选 3 档</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {groups.map((group) => (
              <SkillGroupCard
                key={group.id}
                group={group}
                groupOptions={groupOptions}
                resumes={resumes}
              />
            ))}
          </section>

          <aside className="flex flex-col gap-4" id="new-group">
            <Card>
              <CardHeader>
                <CardTitle>新建技能分组</CardTitle>
                <CardDescription>
                  先创建分组，再在每个分组里维护具体技能项。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SkillGroupForm mode="create" resumes={resumes} />
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </main>
  )
}
