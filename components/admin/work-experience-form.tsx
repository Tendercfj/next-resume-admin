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
  createWorkExperienceAction,
  updateWorkExperienceAction,
  type WorkExperienceFormState,
  type WorkExperienceFormValues,
} from "@/lib/controllers/work-experiences-controller"
import type {
  ResumeReference,
  WorkExperience,
} from "@/lib/services/work-experiences-service"
import { WORK_EMPLOYMENT_TYPES } from "@/lib/services/work-experiences-service"
import { cn } from "@/lib/utils"

type WorkExperienceFormProps =
  | {
      mode: "create"
      resumes: ResumeReference[]
      workExperience?: never
    }
  | {
      mode: "edit"
      resumes: ResumeReference[]
      workExperience: WorkExperience
    }

type TextFieldName = Exclude<
  keyof WorkExperienceFormValues,
  "isCurrent" | "isVisible" | "resumeId" | "employmentType" | "summary" | "highlightsText"
>

const employmentTypeLabels: Record<(typeof WORK_EMPLOYMENT_TYPES)[number], string> = {
  full_time: "全职",
  part_time: "兼职",
  contract: "合同",
  internship: "实习",
  freelance: "自由职业",
}

function getEmptyValues(resumes: ResumeReference[]): WorkExperienceFormValues {
  return {
    resumeId: resumes[0]?.id ?? "",
    company: "",
    role: "",
    location: "",
    employmentType: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    summary: "",
    highlightsText: "",
    sortOrder: "0",
    isVisible: true,
  }
}

function workExperienceToValues(
  workExperience: WorkExperience
): WorkExperienceFormValues {
  return {
    resumeId: workExperience.resumeId,
    company: workExperience.company,
    role: workExperience.role,
    location: workExperience.location,
    employmentType: workExperience.employmentType,
    startDate: workExperience.startDate,
    endDate: workExperience.endDate,
    isCurrent: workExperience.isCurrent,
    summary: workExperience.summary,
    highlightsText: workExperience.highlights.join("\n"),
    sortOrder: String(workExperience.sortOrder),
    isVisible: workExperience.isVisible,
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

export function WorkExperienceForm({
  mode,
  resumes,
  workExperience,
}: WorkExperienceFormProps) {
  const formId =
    mode === "create"
      ? "work-experience-create"
      : `work-experience-${workExperience.id}`
  const initialValues =
    mode === "create"
      ? getEmptyValues(resumes)
      : workExperienceToValues(workExperience)
  const action =
    mode === "create"
      ? createWorkExperienceAction
      : updateWorkExperienceAction.bind(null, workExperience.id)
  const [state, formAction, pending] = useActionState<
    WorkExperienceFormState,
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
            name="company"
            label="公司名称"
            value={values.company}
            error={state.fieldErrors?.company}
            disabled={fieldsDisabled}
            placeholder="OpenAI"
            maxLength={160}
            required
          />
          <TextInputField
            formId={formId}
            name="role"
            label="职位名称"
            value={values.role}
            error={state.fieldErrors?.role}
            disabled={fieldsDisabled}
            placeholder="Staff Engineer"
            maxLength={160}
            required
          />
          <TextInputField
            formId={formId}
            name="location"
            label="工作地点"
            value={values.location}
            error={state.fieldErrors?.location}
            disabled={fieldsDisabled}
            placeholder="Shanghai / Remote"
            maxLength={120}
          />
          <Field data-invalid={Boolean(state.fieldErrors?.employmentType)}>
            <FieldLabel htmlFor={`${formId}-employmentType`}>
              雇佣类型
            </FieldLabel>
            <NativeSelect
              id={`${formId}-employmentType`}
              name="employmentType"
              defaultValue={values.employmentType}
              aria-invalid={Boolean(state.fieldErrors?.employmentType)}
              disabled={fieldsDisabled}
            >
              <option value="">未设置</option>
              {WORK_EMPLOYMENT_TYPES.map((employmentType) => (
                <option key={employmentType} value={employmentType}>
                  {employmentTypeLabels[employmentType]}
                </option>
              ))}
            </NativeSelect>
            <FieldError>{state.fieldErrors?.employmentType}</FieldError>
          </Field>
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

        <Field data-invalid={Boolean(state.fieldErrors?.summary)}>
          <FieldLabel htmlFor={`${formId}-summary`}>工作概述</FieldLabel>
          <Textarea
            id={`${formId}-summary`}
            name="summary"
            defaultValue={values.summary}
            placeholder="概括职责范围、业务目标和核心成果。"
            maxLength={4000}
            aria-invalid={Boolean(state.fieldErrors?.summary)}
            disabled={fieldsDisabled}
          />
          <FieldError>{state.fieldErrors?.summary}</FieldError>
        </Field>

        <Field data-invalid={Boolean(state.fieldErrors?.highlightsText)}>
          <FieldLabel htmlFor={`${formId}-highlightsText`}>
            工作亮点
          </FieldLabel>
          <Textarea
            id={`${formId}-highlightsText`}
            name="highlightsText"
            defaultValue={values.highlightsText}
            placeholder={"主导后台重构\n将响应延迟降低 40%\n建立发布流程与监控"}
            maxLength={4000}
            aria-invalid={Boolean(state.fieldErrors?.highlightsText)}
            disabled={fieldsDisabled}
          />
          <FieldDescription>使用换行或逗号分隔多个亮点。</FieldDescription>
          <FieldError>{state.fieldErrors?.highlightsText}</FieldError>
        </Field>

        <label
          className={cn(
            "flex items-start gap-3 rounded-lg border bg-muted/40 p-3 text-sm",
            fieldsDisabled && "opacity-70"
          )}
        >
          <input
            type="checkbox"
            name="isCurrent"
            defaultChecked={values.isCurrent}
            disabled={fieldsDisabled}
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          <span className="min-w-0">
            <span className="block font-medium">当前任职</span>
            <FieldDescription className="mt-1">
              勾选后建议结束日期留空，页面会显示为“至今”。
            </FieldDescription>
          </span>
        </label>

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
              关闭后工作经历仍保留在后台，但不会出现在公开简历中。
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
          {pending ? "正在保存" : mode === "create" ? "创建经历" : "保存经历"}
        </Button>
      </div>
    </form>
  )
}
