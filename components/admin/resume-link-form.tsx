"use client"

import { useActionState } from "react"
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  PlusIcon,
  SaveIcon,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import {
  createResumeLinkAction,
  updateResumeLinkAction,
  type ResumeLinkFormState,
  type ResumeLinkFormValues,
} from "@/lib/controllers/resume-links-controller"
import type {
  ResumeLink,
  ResumeReference,
} from "@/lib/services/resume-links-service"
import { cn } from "@/lib/utils"

type ResumeLinkFormProps =
  | {
      mode: "create"
      resumes: ResumeReference[]
      link?: never
    }
  | {
      mode: "edit"
      resumes: ResumeReference[]
      link: ResumeLink
    }

type TextFieldName = Exclude<keyof ResumeLinkFormValues, "isVisible" | "resumeId">

function getEmptyValues(resumes: ResumeReference[]): ResumeLinkFormValues {
  return {
    resumeId: resumes[0]?.id ?? "",
    label: "",
    url: "",
    icon: "",
    sortOrder: "0",
    isVisible: true,
  }
}

function linkToValues(link: ResumeLink): ResumeLinkFormValues {
  return {
    resumeId: link.resumeId,
    label: link.label,
    url: link.url,
    icon: link.icon,
    sortOrder: String(link.sortOrder),
    isVisible: link.isVisible,
  }
}

type TextInputFieldProps = {
  formId: string
  name: TextFieldName
  label: string
  value: string
  error?: string
  disabled: boolean
  type?: string
  placeholder?: string
  maxLength?: number
  required?: boolean
}

function TextInputField({
  formId,
  name,
  label,
  value,
  error,
  disabled,
  type = "text",
  placeholder,
  maxLength,
  required,
}: TextInputFieldProps) {
  const id = `${formId}-${name}`

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name={name}
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        disabled={disabled}
        required={required}
      />
      <FieldError>{error}</FieldError>
    </Field>
  )
}

export function ResumeLinkForm({ mode, resumes, link }: ResumeLinkFormProps) {
  const formId = mode === "create" ? "resume-link-create" : `resume-link-${link.id}`
  const initialValues =
    mode === "create" ? getEmptyValues(resumes) : linkToValues(link)
  const action =
    mode === "create"
      ? createResumeLinkAction
      : updateResumeLinkAction.bind(null, link.id)
  const [state, formAction, pending] = useActionState<ResumeLinkFormState, FormData>(
    action,
    {
      message: "",
      values: initialValues,
    }
  )
  const values = state.values ?? initialValues
  const alertVariant = state.success ? "default" : "destructive"
  const fieldsDisabled = pending || resumes.length === 0

  return (
    <form
      key={state.resetKey ?? formId}
      action={formAction}
      className="flex flex-col gap-4"
    >
      {state.message ? (
        <Alert variant={alertVariant} aria-live="polite">
          {state.success ? <CheckCircle2Icon /> : <CircleAlertIcon />}
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup className="gap-4">
        <Field data-invalid={Boolean(state.fieldErrors?.resumeId)}>
          <FieldLabel htmlFor={`${formId}-resumeId`}>关联资料</FieldLabel>
          <NativeSelect
            id={`${formId}-resumeId`}
            name="resumeId"
            defaultValue={values.resumeId}
            aria-invalid={Boolean(state.fieldErrors?.resumeId)}
            disabled={fieldsDisabled}
          >
            {resumes.length === 0 ? (
              <option value="">暂无可用资料</option>
            ) : null}
            {resumes.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resume.title} ({resume.slug})
              </option>
            ))}
          </NativeSelect>
          <FieldError>{state.fieldErrors?.resumeId}</FieldError>
        </Field>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextInputField
            formId={formId}
            name="label"
            label="链接名称"
            value={values.label}
            error={state.fieldErrors?.label}
            disabled={fieldsDisabled}
            placeholder="GitHub"
            maxLength={120}
            required
          />
          <TextInputField
            formId={formId}
            name="sortOrder"
            label="排序"
            value={values.sortOrder}
            error={state.fieldErrors?.sortOrder}
            disabled={fieldsDisabled}
            type="number"
            placeholder="0"
          />
          <TextInputField
            formId={formId}
            name="url"
            label="链接地址"
            value={values.url}
            error={state.fieldErrors?.url}
            disabled={fieldsDisabled}
            type="url"
            placeholder="https://github.com/name"
            maxLength={500}
            required
          />
          <TextInputField
            formId={formId}
            name="icon"
            label="图标键"
            value={values.icon}
            error={state.fieldErrors?.icon}
            disabled={fieldsDisabled}
            placeholder="github"
            maxLength={80}
          />
        </div>

        <label
          className={cn(
            "flex items-start gap-3 rounded-lg border bg-muted/40 p-3 text-sm",
            fieldsDisabled && "opacity-70"
          )}
        >
          <input
            type="checkbox"
            name="isVisible"
            defaultChecked={values.isVisible}
            disabled={fieldsDisabled}
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          <span className="min-w-0">
            <span className="block font-medium">前台可见</span>
            <FieldDescription className="mt-1">
              关闭后链接仍会保留在后台，但公开简历不再展示。
            </FieldDescription>
          </span>
        </label>
      </FieldGroup>

      <div className="flex justify-end">
        <Button type="submit" disabled={fieldsDisabled} className="cursor-pointer">
          {pending ? (
            <Spinner data-icon="inline-start" />
          ) : mode === "create" ? (
            <PlusIcon data-icon="inline-start" />
          ) : (
            <SaveIcon data-icon="inline-start" />
          )}
          {pending ? "正在保存" : mode === "create" ? "创建链接" : "保存链接"}
        </Button>
      </div>
    </form>
  )
}
