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
  createProjectAction,
  updateProjectAction,
  type ProjectFormState,
  type ProjectFormValues,
} from "@/lib/controllers/projects-controller"
import type {
  ProjectRecord,
  ResumeReference,
} from "@/lib/services/projects-service"
import { cn } from "@/lib/utils"

type ProjectFormProps =
  | {
      mode: "create"
      resumes: ResumeReference[]
      project?: never
    }
  | {
      mode: "edit"
      resumes: ResumeReference[]
      project: ProjectRecord
    }

type TextFieldName = Exclude<
  keyof ProjectFormValues,
  | "isFeatured"
  | "isVisible"
  | "resumeId"
  | "description"
  | "techStackText"
  | "highlightsText"
>

function getEmptyValues(resumes: ResumeReference[]): ProjectFormValues {
  return {
    resumeId: resumes[0]?.id ?? "",
    slug: "",
    name: "",
    role: "",
    description: "",
    techStackText: "",
    highlightsText: "",
    projectUrl: "",
    sourceUrl: "",
    startDate: "",
    endDate: "",
    isFeatured: false,
    sortOrder: "0",
    isVisible: true,
  }
}

function projectToValues(project: ProjectRecord): ProjectFormValues {
  return {
    resumeId: project.resumeId,
    slug: project.slug,
    name: project.name,
    role: project.role,
    description: project.description,
    techStackText: project.techStack.join(", "),
    highlightsText: project.highlights.join("\n"),
    projectUrl: project.projectUrl,
    sourceUrl: project.sourceUrl,
    startDate: project.startDate,
    endDate: project.endDate,
    isFeatured: project.isFeatured,
    sortOrder: String(project.sortOrder),
    isVisible: project.isVisible,
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

export function ProjectForm({ mode, resumes, project }: ProjectFormProps) {
  const formId = mode === "create" ? "project-create" : `project-${project.id}`
  const initialValues =
    mode === "create" ? getEmptyValues(resumes) : projectToValues(project)
  const action =
    mode === "create"
      ? createProjectAction
      : updateProjectAction.bind(null, project.id)
  const [state, formAction, pending] = useActionState<ProjectFormState, FormData>(
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
            name="slug"
            label="项目 Slug"
            value={values.slug}
            error={state.fieldErrors?.slug}
            disabled={fieldsDisabled}
            placeholder="resume-admin"
            maxLength={80}
            required
          />
          <TextInputField
            formId={formId}
            name="name"
            label="项目名称"
            value={values.name}
            error={state.fieldErrors?.name}
            disabled={fieldsDisabled}
            placeholder="Next Resume Admin"
            maxLength={160}
            required
          />
          <TextInputField
            formId={formId}
            name="role"
            label="项目角色"
            value={values.role}
            error={state.fieldErrors?.role}
            disabled={fieldsDisabled}
            placeholder="Product Engineer"
            maxLength={160}
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
            name="projectUrl"
            label="项目链接"
            value={values.projectUrl}
            error={state.fieldErrors?.projectUrl}
            disabled={fieldsDisabled}
            type="url"
            placeholder="https://example.com"
            maxLength={500}
          />
          <TextInputField
            formId={formId}
            name="sourceUrl"
            label="源码链接"
            value={values.sourceUrl}
            error={state.fieldErrors?.sourceUrl}
            disabled={fieldsDisabled}
            type="url"
            placeholder="https://github.com/name/repo"
            maxLength={500}
          />
        </div>

        <Field data-invalid={Boolean(state.fieldErrors?.description)}>
          <FieldLabel htmlFor={`${formId}-description`}>项目简介</FieldLabel>
          <Textarea
            id={`${formId}-description`}
            name="description"
            defaultValue={values.description}
            placeholder="概括项目目标、业务背景和核心价值。"
            maxLength={4000}
            aria-invalid={Boolean(state.fieldErrors?.description)}
            disabled={fieldsDisabled}
          />
          <FieldError>{state.fieldErrors?.description}</FieldError>
        </Field>

        <Field data-invalid={Boolean(state.fieldErrors?.techStackText)}>
          <FieldLabel htmlFor={`${formId}-techStackText`}>技术栈</FieldLabel>
          <Textarea
            id={`${formId}-techStackText`}
            name="techStackText"
            defaultValue={values.techStackText}
            placeholder="Next.js, React, Tailwind CSS, Neon"
            maxLength={2000}
            aria-invalid={Boolean(state.fieldErrors?.techStackText)}
            disabled={fieldsDisabled}
          />
          <FieldDescription>使用逗号或换行分隔多个技术项。</FieldDescription>
          <FieldError>{state.fieldErrors?.techStackText}</FieldError>
        </Field>

        <Field data-invalid={Boolean(state.fieldErrors?.highlightsText)}>
          <FieldLabel htmlFor={`${formId}-highlightsText`}>项目亮点</FieldLabel>
          <Textarea
            id={`${formId}-highlightsText`}
            name="highlightsText"
            defaultValue={values.highlightsText}
            placeholder={"完成后台鉴权闭环\n建立统一内容 CRUD 架构\n实现消息状态流转"}
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
            name="isFeatured"
            defaultChecked={values.isFeatured}
            disabled={fieldsDisabled}
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          <span className="min-w-0">
            <span className="block font-medium">精选项目</span>
            <FieldDescription className="mt-1">
              勾选后项目在公开简历中可优先展示。
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
              关闭后项目仍保留在后台，但不会显示在公开简历中。
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
          {pending ? "正在保存" : mode === "create" ? "创建项目" : "保存项目"}
        </Button>
      </div>
    </form>
  )
}
