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
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  createResumeAction,
  updateResumeAction,
  type ResumeFormState,
  type ResumeFormValues,
} from "@/lib/controllers/resumes-controller"
import type { ResumeProfile } from "@/lib/services/resumes-service"
import { cn } from "@/lib/utils"

type ResumeProfileFormProps =
  | {
      mode: "create"
      resume?: never
    }
  | {
      mode: "edit"
      resume: ResumeProfile
    }

type TextFieldName = Exclude<keyof ResumeFormValues, "isPublished">

const emptyValues: ResumeFormValues = {
  slug: "",
  locale: "zh-CN",
  title: "",
  ownerName: "",
  headline: "",
  summary: "",
  avatarUrl: "",
  location: "",
  email: "",
  phone: "",
  websiteUrl: "",
  githubUrl: "",
  linkedinUrl: "",
  isPublished: false,
}

function profileToValues(resume: ResumeProfile): ResumeFormValues {
  return {
    slug: resume.slug,
    locale: resume.locale,
    title: resume.title,
    ownerName: resume.ownerName,
    headline: resume.headline,
    summary: resume.summary,
    avatarUrl: resume.avatarUrl,
    location: resume.location,
    email: resume.email,
    phone: resume.phone,
    websiteUrl: resume.websiteUrl,
    githubUrl: resume.githubUrl,
    linkedinUrl: resume.linkedinUrl,
    isPublished: resume.isPublished,
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
  autoComplete?: string
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
  autoComplete,
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
        autoComplete={autoComplete}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        disabled={disabled}
        required={required}
      />
      <FieldError>{error}</FieldError>
    </Field>
  )
}

export function ResumeProfileForm({ mode, resume }: ResumeProfileFormProps) {
  const formId = mode === "create" ? "resume-create" : `resume-${resume.id}`
  const initialValues = mode === "create" ? emptyValues : profileToValues(resume)
  const action =
    mode === "create"
      ? createResumeAction
      : updateResumeAction.bind(null, resume.id)
  const [state, formAction, pending] = useActionState<ResumeFormState, FormData>(
    action,
    {
      message: "",
      values: initialValues,
    }
  )
  const values = state.values ?? initialValues
  const fieldsDisabled = pending
  const alertVariant = state.success ? "default" : "destructive"

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextInputField
            formId={formId}
            name="slug"
            label="Slug"
            value={values.slug}
            error={state.fieldErrors?.slug}
            disabled={fieldsDisabled}
            placeholder="main-resume"
            maxLength={80}
            required
          />
          <TextInputField
            formId={formId}
            name="locale"
            label="语言"
            value={values.locale}
            error={state.fieldErrors?.locale}
            disabled={fieldsDisabled}
            placeholder="zh-CN"
            maxLength={12}
            required
          />
          <TextInputField
            formId={formId}
            name="title"
            label="简历标题"
            value={values.title}
            error={state.fieldErrors?.title}
            disabled={fieldsDisabled}
            placeholder="个人简历"
            maxLength={120}
            required
          />
          <TextInputField
            formId={formId}
            name="ownerName"
            label="姓名"
            value={values.ownerName}
            error={state.fieldErrors?.ownerName}
            disabled={fieldsDisabled}
            placeholder="Tender"
            maxLength={120}
            autoComplete="name"
            required
          />
          <TextInputField
            formId={formId}
            name="headline"
            label="一句话定位"
            value={values.headline}
            error={state.fieldErrors?.headline}
            disabled={fieldsDisabled}
            placeholder="AI Engineer / Full-stack Developer"
            maxLength={200}
          />
          <TextInputField
            formId={formId}
            name="location"
            label="所在地"
            value={values.location}
            error={state.fieldErrors?.location}
            disabled={fieldsDisabled}
            placeholder="Shanghai, China"
            maxLength={120}
            autoComplete="address-level2"
          />
          <TextInputField
            formId={formId}
            name="email"
            label="邮箱"
            value={values.email}
            error={state.fieldErrors?.email}
            disabled={fieldsDisabled}
            type="email"
            placeholder="hello@example.com"
            maxLength={254}
            autoComplete="email"
          />
          <TextInputField
            formId={formId}
            name="phone"
            label="电话"
            value={values.phone}
            error={state.fieldErrors?.phone}
            disabled={fieldsDisabled}
            placeholder="+86 138 0000 0000"
            maxLength={80}
            autoComplete="tel"
          />
          <TextInputField
            formId={formId}
            name="avatarUrl"
            label="头像 URL"
            value={values.avatarUrl}
            error={state.fieldErrors?.avatarUrl}
            disabled={fieldsDisabled}
            type="url"
            placeholder="https://example.com/avatar.png"
            maxLength={500}
          />
          <TextInputField
            formId={formId}
            name="websiteUrl"
            label="个人网站"
            value={values.websiteUrl}
            error={state.fieldErrors?.websiteUrl}
            disabled={fieldsDisabled}
            type="url"
            placeholder="https://example.com"
            maxLength={500}
            autoComplete="url"
          />
          <TextInputField
            formId={formId}
            name="githubUrl"
            label="GitHub"
            value={values.githubUrl}
            error={state.fieldErrors?.githubUrl}
            disabled={fieldsDisabled}
            type="url"
            placeholder="https://github.com/name"
            maxLength={500}
          />
          <TextInputField
            formId={formId}
            name="linkedinUrl"
            label="LinkedIn"
            value={values.linkedinUrl}
            error={state.fieldErrors?.linkedinUrl}
            disabled={fieldsDisabled}
            type="url"
            placeholder="https://linkedin.com/in/name"
            maxLength={500}
          />
        </div>

        <Field data-invalid={Boolean(state.fieldErrors?.summary)}>
          <FieldLabel htmlFor={`${formId}-summary`}>简介</FieldLabel>
          <Textarea
            id={`${formId}-summary`}
            name="summary"
            defaultValue={values.summary}
            placeholder="概括核心能力、行业经验和作品方向。"
            maxLength={2000}
            aria-invalid={Boolean(state.fieldErrors?.summary)}
            disabled={fieldsDisabled}
          />
          <FieldError>{state.fieldErrors?.summary}</FieldError>
        </Field>

        <label
          className={cn(
            "flex items-start gap-3 rounded-lg border bg-muted/40 p-3 text-sm",
            fieldsDisabled && "opacity-70"
          )}
        >
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={values.isPublished}
            disabled={fieldsDisabled}
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          <span className="min-w-0">
            <span className="block font-medium">公开发布</span>
            <FieldDescription className="mt-1">
              标记后公开简历项目可按 slug 读取这份主档。
            </FieldDescription>
          </span>
        </label>
      </FieldGroup>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="cursor-pointer">
          {pending ? (
            <Spinner data-icon="inline-start" />
          ) : mode === "create" ? (
            <PlusIcon data-icon="inline-start" />
          ) : (
            <SaveIcon data-icon="inline-start" />
          )}
          {pending ? "正在保存" : mode === "create" ? "创建资料" : "保存资料"}
        </Button>
      </div>
    </form>
  )
}
