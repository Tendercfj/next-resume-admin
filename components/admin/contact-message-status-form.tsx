"use client"

import { useActionState } from "react"
import { CheckCircle2Icon, CircleAlertIcon, SaveIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { NativeSelect } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import {
  updateContactMessageStatusAction,
  type ContactMessageStatusFormState,
} from "@/lib/controllers/contact-messages-controller"
import {
  CONTACT_MESSAGE_STATUSES,
  type ContactMessage,
} from "@/lib/services/contact-messages-service"

type ContactMessageStatusFormProps = {
  contactMessage: ContactMessage
}

const statusLabels: Record<(typeof CONTACT_MESSAGE_STATUSES)[number], string> = {
  new: "待处理",
  read: "已读",
  replied: "已回复",
  archived: "已归档",
  spam: "垃圾消息",
}

export function ContactMessageStatusForm({
  contactMessage,
}: ContactMessageStatusFormProps) {
  const action = updateContactMessageStatusAction.bind(null, contactMessage.id)
  const [state, formAction, pending] = useActionState<
    ContactMessageStatusFormState,
    FormData
  >(action, {
    message: "",
    values: {
      status: contactMessage.status,
    },
  })
  const values = state.values ?? {
    status: contactMessage.status,
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.message ? (
        <Alert variant={state.success ? "default" : "destructive"} aria-live="polite">
          {state.success ? <CheckCircle2Icon /> : <CircleAlertIcon />}
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <Field data-invalid={Boolean(state.fieldErrors?.status)}>
          <FieldLabel htmlFor={`message-status-${contactMessage.id}`}>
            处理状态
          </FieldLabel>
          <NativeSelect
            id={`message-status-${contactMessage.id}`}
            name="status"
            defaultValue={values.status}
            aria-invalid={Boolean(state.fieldErrors?.status)}
            disabled={pending}
          >
            {CONTACT_MESSAGE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </NativeSelect>
          <FieldError>{state.fieldErrors?.status}</FieldError>
        </Field>

        <Button type="submit" disabled={pending} className="cursor-pointer">
          {pending ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
          {pending ? "正在保存" : "保存状态"}
        </Button>
      </div>
    </form>
  )
}
