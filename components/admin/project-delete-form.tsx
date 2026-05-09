"use client"

import { useActionState } from "react"
import { CircleAlertIcon, Trash2Icon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  deleteProjectAction,
  type DeleteProjectFormState,
} from "@/lib/controllers/projects-controller"

type ProjectDeleteFormProps = {
  projectId: string
}

const initialState: DeleteProjectFormState = {
  message: "",
}

export function ProjectDeleteForm({ projectId }: ProjectDeleteFormProps) {
  const action = deleteProjectAction.bind(null, projectId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-3"
    >
      <p className="text-sm text-muted-foreground">
        删除后该项目会立刻从后台列表和公开简历中移除。
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
