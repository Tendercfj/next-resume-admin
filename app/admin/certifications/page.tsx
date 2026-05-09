import {
  ArrowLeftIcon,
  AwardIcon,
  ExternalLinkIcon,
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
import { CertificationDeleteForm } from "@/components/admin/certification-delete-form"
import { CertificationForm } from "@/components/admin/certification-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDate, formatDateTime } from "@/lib/admin/formatters"
import { getAdminSection } from "@/lib/admin/sections"
import { getCertificationsPageData } from "@/lib/controllers/certifications-controller"
import type {
  CertificationRecord,
  ResumeReference,
} from "@/lib/services/certifications-service"

function CertificationCard({
  certification,
  resumes,
}: {
  certification: CertificationRecord
  resumes: ResumeReference[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="min-w-0 truncate">{certification.title}</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          {certification.issuer ? <span>{certification.issuer}</span> : null}
          <span className="font-mono text-xs">{certification.resumeSlug}</span>
        </CardDescription>
        <CardAction>
          <VisibilityBadge isVisible={certification.isVisible} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <PublishBadge isPublished={certification.resumeIsPublished} />
          <span className="text-sm text-muted-foreground">
            {certification.resumeTitle}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">颁发日期</p>
            <p className="mt-1 text-sm font-medium">
              {certification.issuedOn
                ? formatDate(certification.issuedOn)
                : "未设置"}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">排序</p>
            <p className="mt-1 text-sm font-medium">
              {certification.sortOrder}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">更新于</p>
            <p className="mt-1 text-sm font-medium">
              {formatDateTime(certification.updatedAt)}
            </p>
          </div>
        </div>

        {certification.credentialUrl ? (
          <a
            href={certification.credentialUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            查看凭证
            <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
          </a>
        ) : null}

        <details className="group rounded-lg border bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <span className="flex min-w-0 items-center gap-2">
              <PencilLineIcon
                className="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="truncate">编辑证书</span>
            </span>
            <span className="text-xs text-muted-foreground group-open:hidden">
              展开
            </span>
            <span className="hidden text-xs text-muted-foreground group-open:inline">
              收起
            </span>
          </summary>
          <div className="border-t p-3">
            <CertificationForm
              mode="edit"
              certification={certification}
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
            <CertificationDeleteForm certificationId={certification.id} />
          </div>
        </details>
      </CardContent>
    </Card>
  )
}

export default async function AdminCertificationsPage() {
  const section = getAdminSection("certifications")
  const data = await getCertificationsPageData()

  if (data.accessDenied) {
    return (
      <AccessDeniedState
        title="无法访问证书资质"
        description="当前账号没有维护 certifications 的权限。"
      />
    )
  }

  const resumes = data.resumes
  const certifications = data.certifications
  const visibleCount = certifications.filter((item) => item.isVisible).length
  const Icon = section?.icon ?? AwardIcon

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
              {section?.title ?? "证书资质"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              维护 certifications，记录证书名称、颁发方、日期和凭证链接。
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
            <a href="#new-certification">
              <PlusIcon data-icon="inline-start" />
              新建证书
            </a>
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle>证书总数</CardTitle>
            <CardDescription className="text-2xl font-semibold text-foreground">
              {certifications.length}
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
              证书需要关联到某一份 resumes 主档。请先创建资料，再回来维护证书。
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <section className="flex min-w-0 flex-col gap-4">
            {certifications.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>还没有证书资质</CardTitle>
                  <CardDescription>
                    添加证书、奖项或认证信息，补充公开简历的资质部分。
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            {certifications.map((certification) => (
              <CertificationCard
                key={certification.id}
                certification={certification}
                resumes={resumes}
              />
            ))}
          </section>

          <aside className="flex flex-col gap-4" id="new-certification">
            <Card>
              <CardHeader>
                <CardTitle>新建证书</CardTitle>
                <CardDescription>
                  添加一个新的证书、奖项或认证记录，并控制公开展示状态。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CertificationForm mode="create" resumes={resumes} />
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </main>
  )
}
