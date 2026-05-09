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
  createCertificationAction,
  updateCertificationAction,
  type CertificationFormState,
  type CertificationFormValues,
} from "@/lib/controllers/certifications-controller"
import type {
  CertificationRecord,
  ResumeReference,
} from "@/lib/services/certifications-service"
import { cn } from "@/lib/utils"

type CertificationFormProps =
  | {
      mode: "create"
      resumes: ResumeReference[]
      certification?: never
    }
  | {
      mode: "edit"
      resumes: ResumeReference[]
      certification: CertificationRecord
    }

type TextFieldName = Exclude<
  keyof CertificationFormValues,
  "isVisible" | "resumeId"
>

function getEmptyValues(resumes: ResumeReference[]): CertificationFormValues {
  return {
    resumeId: resumes[0]?.id ?? "",
    title: "",
    issuer: "",
    issuedOn: "",
    credentialUrl: "",
    sortOrder: "0",
    isVisible: true,
  }
}

function certificationToValues(
  certification: CertificationRecord
): CertificationFormValues {
  return {
    resumeId: certification.resumeId,
    title: certification.title,
    issuer: certification.issuer,
    issuedOn: certification.issuedOn,
    credentialUrl: certification.credentialUrl,
    sortOrder: String(certification.sortOrder),
    isVisible: certification.isVisible,
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

export function CertificationForm({
  mode,
  resumes,
  certification,
}: CertificationFormProps) {
  const formId =
    mode === "create" ? "certification-create" : `certification-${certification.id}`
  const initialValues =
    mode === "create"
      ? getEmptyValues(resumes)
      : certificationToValues(certification)
  const action =
    mode === "create"
      ? createCertificationAction
      : updateCertificationAction.bind(null, certification.id)
  const [state, formAction, pending] = useActionState<
    CertificationFormState,
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
            name="title"
            label="证书名称"
            value={values.title}
            error={state.fieldErrors?.title}
            disabled={fieldsDisabled}
            placeholder="AWS Certified Developer"
            maxLength={160}
            required
          />
          <TextInputField
            formId={formId}
            name="issuer"
            label="颁发机构"
            value={values.issuer}
            error={state.fieldErrors?.issuer}
            disabled={fieldsDisabled}
            placeholder="Amazon Web Services"
            maxLength={160}
          />
          <TextInputField
            formId={formId}
            name="issuedOn"
            label="颁发日期"
            value={values.issuedOn}
            error={state.fieldErrors?.issuedOn}
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
          <div className="md:col-span-2">
            <TextInputField
              formId={formId}
              name="credentialUrl"
              label="凭证链接"
              value={values.credentialUrl}
              error={state.fieldErrors?.credentialUrl}
              disabled={fieldsDisabled}
              type="url"
              placeholder="https://example.com/credential"
              maxLength={500}
            />
          </div>
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
              关闭后证书仍保留在后台，但不会出现在公开简历中。
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
          {pending ? "正在保存" : mode === "create" ? "创建证书" : "保存证书"}
        </Button>
      </div>
    </form>
  )
}
