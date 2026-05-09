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
import { Textarea } from "@/components/ui/textarea"
import {
  createSkillGroupAction,
  updateSkillGroupAction,
  type SkillGroupFormState,
  type SkillGroupFormValues,
} from "@/lib/controllers/skills-controller"
import type {
  ResumeReference,
  SkillGroup,
} from "@/lib/services/skills-service"
import { cn } from "@/lib/utils"

type SkillGroupFormProps =
  | {
      mode: "create"
      resumes: ResumeReference[]
      group?: never
    }
  | {
      mode: "edit"
      resumes: ResumeReference[]
      group: SkillGroup
    }

type TextFieldName = Exclude<
  keyof SkillGroupFormValues,
  "isVisible" | "resumeId" | "description"
>

function getEmptyValues(resumes: ResumeReference[]): SkillGroupFormValues {
  return {
    resumeId: resumes[0]?.id ?? "",
    name: "",
    description: "",
    sortOrder: "0",
    isVisible: true,
  }
}

function groupToValues(group: SkillGroup): SkillGroupFormValues {
  return {
    resumeId: group.resumeId,
    name: group.name,
    description: group.description,
    sortOrder: String(group.sortOrder),
    isVisible: group.isVisible,
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

export function SkillGroupForm({
  mode,
  resumes,
  group,
}: SkillGroupFormProps) {
  const formId = mode === "create" ? "skill-group-create" : `skill-group-${group.id}`
  const initialValues =
    mode === "create" ? getEmptyValues(resumes) : groupToValues(group)
  const action =
    mode === "create"
      ? createSkillGroupAction
      : updateSkillGroupAction.bind(null, group.id)
  const [state, formAction, pending] = useActionState<SkillGroupFormState, FormData>(
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
            name="name"
            label="分组名称"
            value={values.name}
            error={state.fieldErrors?.name}
            disabled={fieldsDisabled}
            placeholder="核心技术栈"
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
        </div>

        <Field data-invalid={Boolean(state.fieldErrors?.description)}>
          <FieldLabel htmlFor={`${formId}-description`}>分组说明</FieldLabel>
          <Textarea
            id={`${formId}-description`}
            name="description"
            defaultValue={values.description}
            placeholder="概括这个分组的覆盖范围，例如后端、基础设施、产品协作等。"
            maxLength={500}
            aria-invalid={Boolean(state.fieldErrors?.description)}
            disabled={fieldsDisabled}
          />
          <FieldError>{state.fieldErrors?.description}</FieldError>
        </Field>

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
              关闭后，这个分组和其中技能项都会继续保留，但公开简历不再展示它。
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
          {pending ? "正在保存" : mode === "create" ? "创建分组" : "保存分组"}
        </Button>
      </div>
    </form>
  )
}
