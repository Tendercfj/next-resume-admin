import type { CurrentAdmin } from "@/lib/auth/session"
import {
  findContactMessageById,
  listContactMessages,
  updateContactMessageStatus,
  type ContactMessageStatus,
  type ContactMessageRow,
} from "@/lib/dao/contact-messages-dao"
import { toIsoString } from "@/lib/services/admin-content-shared"
import {
  writeAuditLog,
  type RequestAuditContext,
} from "@/lib/services/admin-audit-service"

export const CONTACT_MESSAGE_STATUSES = [
  "new",
  "read",
  "replied",
  "archived",
  "spam",
] as const

export type MessageStatus = (typeof CONTACT_MESSAGE_STATUSES)[number]

export type ContactMessage = {
  id: string
  resumeId: string | null
  resumeSlug: string
  resumeTitle: string
  senderName: string
  senderEmail: string
  senderCompany: string
  subject: string
  message: string
  source: string
  status: MessageStatus
  ipHash: string
  userAgent: string
  createdAt: string
  updatedAt: string
}

export type ContactMessageStatusInput = {
  status: string
}

export type ContactMessageStatusFieldErrors = Partial<
  Record<keyof ContactMessageStatusInput, string>
>

export type ContactMessageStatusMutationResult =
  | {
      ok: true
      contactMessage: ContactMessage
      message: string
    }
  | {
      ok: false
      message: string
      fieldErrors?: ContactMessageStatusFieldErrors
    }

function rowToContactMessage(row: ContactMessageRow): ContactMessage {
  return {
    id: row.id,
    resumeId: row.resume_id,
    resumeSlug: row.resume_slug ?? "",
    resumeTitle: row.resume_title ?? "",
    senderName: row.sender_name,
    senderEmail: row.sender_email,
    senderCompany: row.sender_company ?? "",
    subject: row.subject ?? "",
    message: row.message,
    source: row.source,
    status: row.status,
    ipHash: row.ip_hash ?? "",
    userAgent: row.user_agent ?? "",
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  }
}

function validateContactMessageStatusInput(input: ContactMessageStatusInput) {
  const fieldErrors: ContactMessageStatusFieldErrors = {}

  if (!input.status.trim()) {
    fieldErrors.status = "请选择消息状态"
  } else if (
    !CONTACT_MESSAGE_STATUSES.includes(input.status.trim() as MessageStatus)
  ) {
    fieldErrors.status = "消息状态不合法"
  }

  return fieldErrors
}

export async function getContactMessages() {
  const rows = await listContactMessages()
  return rows.map(rowToContactMessage)
}

export async function updateManagedContactMessageStatus(
  contactMessageId: string,
  input: ContactMessageStatusInput,
  admin: CurrentAdmin,
  context: RequestAuditContext
): Promise<ContactMessageStatusMutationResult> {
  const fieldErrors = validateContactMessageStatusInput(input)

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "请检查消息状态",
      fieldErrors,
    }
  }

  const current = await findContactMessageById(contactMessageId)

  if (!current) {
    return {
      ok: false,
      message: "消息不存在或已被删除",
    }
  }

  const nextStatus = input.status.trim() as ContactMessageStatus

  if (current.status === nextStatus) {
    return {
      ok: true,
      contactMessage: rowToContactMessage(current),
      message: "消息状态未变化",
    }
  }

  const updated = await updateContactMessageStatus(contactMessageId, nextStatus)

  if (!updated) {
    return {
      ok: false,
      message: "消息不存在或已被删除",
    }
  }

  await writeAuditLog({
    adminUserId: admin.id,
    action: "contact-message.status.update",
    entityType: "contact_message",
    entityId: updated.id,
    metadata: {
      sender_email: updated.sender_email,
      previous_status: current.status,
      next_status: updated.status,
      source: updated.source,
    },
    context,
  })

  return {
    ok: true,
    contactMessage: rowToContactMessage(updated),
    message: `已将消息状态更新为 ${updated.status}`,
  }
}
