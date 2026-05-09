"use client"

import { useActionState } from "react"
import { CircleAlertIcon, Trash2Icon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  deleteResumeLinkAction,
  type DeleteResumeLinkFormState,
} from "@/lib/controllers/resume-links-controller"

type ResumeLinkDeleteFormProps = {
  linkId: string
}

const initialState: DeleteResumeLinkFormState = {
  message: "",
}

export function ResumeLinkDeleteForm({
  linkId,
}: ResumeLinkDeleteFormProps) {
  const action = deleteResumeLinkAction.bind(null, linkId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-3"
    >
      <p className="text-sm text-muted-foreground">
        删除后该链接会立刻从后台列表中移除，公开简历也不会再展示它。
      </p>

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
