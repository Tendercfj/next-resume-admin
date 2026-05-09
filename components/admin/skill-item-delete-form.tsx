"use client"

import { useActionState } from "react"
import { CircleAlertIcon, Trash2Icon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  deleteSkillItemAction,
  type DeleteSkillItemFormState,
} from "@/lib/controllers/skills-controller"

type SkillItemDeleteFormProps = {
  itemId: string
}

const initialState: DeleteSkillItemFormState = {
  message: "",
}

export function SkillItemDeleteForm({ itemId }: SkillItemDeleteFormProps) {
  const action = deleteSkillItemAction.bind(null, itemId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-3"
    >
      <p className="text-sm text-muted-foreground">
        删除后该技能项会立刻从当前分组中移除。
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
