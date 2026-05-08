"use client"

import { useActionState } from "react"
import { CircleAlertIcon, LogInIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  loginAction,
  type LoginFormState,
} from "@/lib/controllers/admin-auth-controller"

const initialState: LoginFormState = {
  message: "",
}

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState
  )
  const emailError = state.fieldErrors?.email
  const passwordError = state.fieldErrors?.password
  const hasFieldErrors = Boolean(emailError || passwordError)

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FieldGroup>
        <Field data-invalid={Boolean(emailError)}>
          <FieldLabel htmlFor="email">管理员邮箱</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="owner@example.com"
            aria-invalid={Boolean(emailError)}
            disabled={pending}
            required
          />
          <FieldError>{emailError}</FieldError>
        </Field>

        <Field data-invalid={Boolean(passwordError)}>
          <FieldLabel htmlFor="password">密码</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="输入后台密码"
            aria-invalid={Boolean(passwordError)}
            disabled={pending}
            required
          />
          <FieldError>{passwordError}</FieldError>
        </Field>
      </FieldGroup>

      {state.message && !hasFieldErrors ? (
        <Alert variant="destructive" aria-live="polite">
          <CircleAlertIcon />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" className="w-full cursor-pointer" disabled={pending}>
        {pending ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <LogInIcon data-icon="inline-start" />
        )}
        {pending ? "正在验证" : "登录后台"}
      </Button>
    </form>
  )
}
