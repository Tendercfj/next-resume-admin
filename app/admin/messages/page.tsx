import {
  ArrowLeftIcon,
  InboxIcon,
  MailIcon,
  ShieldAlertIcon,
} from "lucide-react"
import Link from "next/link"

import { AccessDeniedState } from "@/components/admin/access-denied-state"
import { MessageStatusBadge } from "@/components/admin/admin-badges"
import { ContactMessageStatusForm } from "@/components/admin/contact-message-status-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDateTime } from "@/lib/admin/formatters"
import { getAdminSection } from "@/lib/admin/sections"
import { getMessagesPageData } from "@/lib/controllers/contact-messages-controller"
import type { ContactMessage } from "@/lib/services/contact-messages-service"

const statusLabels: Record<string, string> = {
  new: "待处理",
  read: "已读",
  replied: "已回复",
  archived: "已归档",
  spam: "垃圾消息",
}

function ContactMessageCard({
  contactMessage,
}: {
  contactMessage: ContactMessage
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="min-w-0 truncate">
          {contactMessage.subject || "无主题消息"}
        </CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <span>{contactMessage.senderName}</span>
          <a
            href={`mailto:${contactMessage.senderEmail}`}
            className="inline-flex items-center gap-1 text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <MailIcon className="size-3.5" aria-hidden="true" />
            {contactMessage.senderEmail}
          </a>
        </CardDescription>
        <CardAction>
          <MessageStatusBadge status={contactMessage.status} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">公司</p>
            <p className="mt-1 truncate text-sm font-medium">
              {contactMessage.senderCompany || "未填写"}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">来源</p>
            <p className="mt-1 truncate text-sm font-medium">
              {contactMessage.source}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">关联资料</p>
            <p className="mt-1 truncate text-sm font-medium">
              {contactMessage.resumeSlug || "未关联"}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">收到时间</p>
            <p className="mt-1 text-sm font-medium">
              {formatDateTime(contactMessage.createdAt)}
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="whitespace-pre-wrap text-sm leading-6">
            {contactMessage.message}
          </p>
        </div>

        {contactMessage.userAgent || contactMessage.ipHash ? (
          <div className="grid grid-cols-1 gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs font-medium">IP Hash</p>
              <p className="mt-1 truncate font-mono text-xs">
                {contactMessage.ipHash || "未记录"}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs font-medium">User Agent</p>
              <p className="mt-1 line-clamp-2 text-xs">
                {contactMessage.userAgent || "未记录"}
              </p>
            </div>
          </div>
        ) : null}

        <div className="rounded-lg border bg-card p-3">
          <ContactMessageStatusForm contactMessage={contactMessage} />
        </div>
      </CardContent>
    </Card>
  )
}

export default async function AdminMessagesPage() {
  const section = getAdminSection("messages")
  const data = await getMessagesPageData()

  if (data.accessDenied) {
    return (
      <AccessDeniedState
        title="无法访问联系消息"
        description="当前账号没有查看 contact_messages 的权限。"
      />
    )
  }

  const contactMessages = data.contactMessages
  const statusCounts = contactMessages.reduce<Record<string, number>>(
    (counts, message) => {
      counts[message.status] = (counts[message.status] ?? 0) + 1
      return counts
    },
    {}
  )
  const Icon = section?.icon ?? InboxIcon

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
              {section?.title ?? "联系消息"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              查看 contact_messages，并更新待处理、已读、已回复、已归档和垃圾消息状态。
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

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {["new", "read", "replied", "archived", "spam"].map((status) => (
          <Card key={status} size="sm">
            <CardHeader>
              <CardTitle>{statusLabels[status]}</CardTitle>
              <CardDescription className="text-2xl font-semibold text-foreground">
                {statusCounts[status] ?? 0}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      {contactMessages.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>暂无联系消息</CardTitle>
            <CardDescription>
              公开简历项目写入 contact_messages 后，会出现在这里。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              <ShieldAlertIcon className="size-4 shrink-0" aria-hidden="true" />
              不在后台创建消息，后台只负责查看和更新状态。
            </div>
          </CardContent>
        </Card>
      ) : (
        <section className="flex flex-col gap-4">
          {contactMessages.map((contactMessage) => (
            <ContactMessageCard
              key={contactMessage.id}
              contactMessage={contactMessage}
            />
          ))}
        </section>
      )}
    </main>
  )
}
