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
  createEducationAction,
  updateEducationAction,
  type EducationFormState,
  type EducationFormValues,
} from "@/lib/controllers/education-controller"
import type {
  EducationRecord,
  ResumeReference,
} from "@/lib/services/education-service"
import { cn } from "@/lib/utils"

type EducationFormProps =
  | {
      mode: "create"
      resumes: ResumeReference[]
      education?: never
    }
  | {
      mode: "edit"
      resumes: ResumeReference[]
      education: EducationRecord
    }

type TextFieldName = Exclude<
  keyof EducationFormValues,
  "isVisible" | "resumeId" | "description"
>

function getEmptyValues(resumes: ResumeReference[]): EducationFormValues {
  return {
    resumeId: resumes[0]?.id ?? "",
    school: "",
    degree: "",
    major: "",
    location: "",
    startDate: "",
    endDate: "",
    description: "",
    sortOrder: "0",
    isVisible: true,
  }
}

function educationToValues(education: EducationRecord): EducationFormValues {
  return {
    resumeId: education.resumeId,
    school: education.school,
    degree: education.degree,
    major: education.major,
    location: education.location,
    startDate: education.startDate,
    endDate: education.endDate,
    description: education.description,
    sortOrder: String(education.sortOrder),
    isVisible: education.isVisible,
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

export function EducationForm({ mode, resumes, education }: EducationFormProps) {
  const formId =
    mode === "create" ? "education-create" : `education-${education.id}`
  const initialValues =
    mode === "create" ? getEmptyValues(resumes) : educationToValues(education)
  const action =
    mode === "create"
      ? createEducationAction
      : updateEducationAction.bind(null, education.id)
  const [state, formAction, pending] = useActionState<
    EducationFormState,
    FormData
  >(action, {
    message: "",
    values: initialValues,
  })
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
            {resumes.length === 0 ? <option value="">暂无可用资料</option> : null}
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
            name="school"
            label="学校名称"
            value={values.school}
            error={state.fieldErrors?.school}
            disabled={fieldsDisabled}
            placeholder="University"
            maxLength={160}
            required
          />
          <TextInputField
            formId={formId}
            name="degree"
            label="学位"
            value={values.degree}
            error={state.fieldErrors?.degree}
            disabled={fieldsDisabled}
            placeholder="Bachelor"
            maxLength={160}
          />
          <TextInputField
            formId={formId}
            name="major"
            label="专业"
            value={values.major}
            error={state.fieldErrors?.major}
            disabled={fieldsDisabled}
            placeholder="Computer Science"
            maxLength={160}
          />
          <TextInputField
            formId={formId}
            name="location"
            label="地点"
            value={values.location}
            error={state.fieldErrors?.location}
            disabled={fieldsDisabled}
            placeholder="Shanghai"
            maxLength={120}
          />
          <TextInputField
            formId={formId}
            name="startDate"
            label="开始日期"
            value={values.startDate}
            error={state.fieldErrors?.startDate}
            disabled={fieldsDisabled}
            type="date"
          />
          <TextInputField
            formId={formId}
            name="endDate"
            label="结束日期"
            value={values.endDate}
            error={state.fieldErrors?.endDate}
            disabled={fieldsDisabled}
            type="date"
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
          <FieldLabel htmlFor={`${formId}-description`}>教育说明</FieldLabel>
          <Textarea
            id={`${formId}-description`}
            name="description"
            defaultValue={values.description}
            placeholder="补充课程、研究方向、奖项或校园项目。"
            maxLength={4000}
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
              关闭后教育经历仍保留在后台，但不会出现在公开简历中。
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
          {pending ? "正在保存" : mode === "create" ? "创建教育" : "保存教育"}
        </Button>
      </div>
    </form>
  )
}
