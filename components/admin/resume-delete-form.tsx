"use client"

import { useActionState } from "react"
import { CircleAlertIcon, Trash2Icon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  deleteResumeAction,
  type DeleteResumeFormState,
} from "@/lib/controllers/resumes-controller"

type ResumeDeleteFormProps = {
  resumeId: string
  slug: string
}

const initialState: DeleteResumeFormState = {
  message: "",
}

export function ResumeDeleteForm({ resumeId, slug }: ResumeDeleteFormProps) {
  const action = deleteResumeAction.bind(null, resumeId)
  const [state, formAction, pending] = useActionState(action, initialState)
  const confirmError = state.fieldErrors?.confirmSlug

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-3">
      <Field data-invalid={Boolean(confirmError)}>
        <FieldLabel htmlFor={`delete-${resumeId}`}>删除资料</FieldLabel>
        <FieldDescription>
          此操作会同时删除关联到这份资料的链接、技能、经历、项目、教育和证书。
        </FieldDescription>
        <Input
          id={`delete-${resumeId}`}
          name="confirmSlug"
          placeholder={slug}
          aria-invalid={Boolean(confirmError)}
          disabled={pending}
          autoComplete="off"
        />
        <FieldError>{confirmError}</FieldError>
      </Field>

      {state.message && !state.success ? (
        <Alert variant="destructive" aria-live="polite">
          <CircleAlertIcon />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="submit"
        variant="destructive"
        size="sm"
        disabled={pending}
        className="w-fit cursor-pointer"
      >
        {pending ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <Trash2Icon data-icon="inline-start" />
        )}
        {pending ? "正在删除" : "确认删除"}
      </Button>
    </form>
  )
}
