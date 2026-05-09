"use server"

import { revalidatePath } from "next/cache"

import { assertAdminRole, requireAdmin } from "@/lib/auth/guards"
import { ADMIN_ROLES } from "@/lib/auth/constants"
import { getRequestAuditContext } from "@/lib/http/request-context"
import {
  getContactMessages,
  updateManagedContactMessageStatus,
  type ContactMessage,
  type ContactMessageStatusFieldErrors,
  type ContactMessageStatusInput,
} from "@/lib/services/contact-messages-service"

const MANAGE_MESSAGE_ROLES = ADMIN_ROLES

export type ContactMessageStatusFormValues = ContactMessageStatusInput

export type ContactMessageStatusFormState = {
  message: string
  success?: boolean
  values?: ContactMessageStatusFormValues
  fieldErrors?: ContactMessageStatusFieldErrors
}

export type MessagesPageData =
  | {
      accessDenied: false
      contactMessages: ContactMessage[]
    }
  | {
      accessDenied: true
      contactMessages: []
    }

function readString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

function readContactMessageStatusFormValues(
  formData: FormData
): ContactMessageStatusFormValues {
  return {
    status: readString(formData.get("status")),
  }
}

async function requireMessageManager() {
  const admin = await requireAdmin()
  assertAdminRole(admin.role, MANAGE_MESSAGE_ROLES)
  return admin
}

function toFormState(
  result: Awaited<ReturnType<typeof updateManagedContactMessageStatus>>,
  values: ContactMessageStatusFormValues
): ContactMessageStatusFormState {
  if (!result.ok) {
    return {
      message: result.message,
      success: false,
      values,
      fieldErrors: result.fieldErrors,
    }
  }

  return {
    message: result.message,
    success: true,
  }
}

export async function getMessagesPageData(): Promise<MessagesPageData> {
  const admin = await requireAdmin()

  if (!MANAGE_MESSAGE_ROLES.includes(admin.role)) {
    return {
      accessDenied: true,
      contactMessages: [],
    }
  }

  const contactMessages = await getContactMessages()

  return {
    accessDenied: false,
    contactMessages,
  }
}

export async function updateContactMessageStatusAction(
  contactMessageId: string,
  _prevState: ContactMessageStatusFormState,
  formData: FormData
): Promise<ContactMessageStatusFormState> {
  const admin = await requireMessageManager()
  const values = readContactMessageStatusFormValues(formData)
  const context = await getRequestAuditContext()
  const result = await updateManagedContactMessageStatus(
    contactMessageId,
    values,
    admin,
    context
  )

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/messages")
  }

  return toFormState(result, values)
}
