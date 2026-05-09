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
  createSkillItemAction,
  updateSkillItemAction,
  type SkillItemFormState,
  type SkillItemFormValues,
} from "@/lib/controllers/skills-controller"
import type { SkillItem } from "@/lib/services/skills-service"
import { cn } from "@/lib/utils"

const skillLevelLabels = {
  familiar: "熟悉",
  proficient: "熟练",
  expert: "精通",
} as const

type SkillItemGroupOption = {
  id: string
  label: string
}

type SkillItemFormProps =
  | {
      mode: "create"
      groupOptions: SkillItemGroupOption[]
      defaultGroupId?: string
      item?: never
    }
  | {
      mode: "edit"
      groupOptions: SkillItemGroupOption[]
      item: SkillItem
      defaultGroupId?: never
    }

type TextFieldName = Exclude<
  keyof SkillItemFormValues,
  "isVisible" | "groupId" | "level" | "keywordsText"
>

function getEmptyValues(
  groupOptions: SkillItemGroupOption[],
  defaultGroupId?: string
): SkillItemFormValues {
  return {
    groupId: defaultGroupId ?? groupOptions[0]?.id ?? "",
    name: "",
    level: "",
    keywordsText: "",
    sortOrder: "0",
    isVisible: true,
  }
}

function itemToValues(item: SkillItem): SkillItemFormValues {
  return {
    groupId: item.groupId,
    name: item.name,
    level: item.level,
    keywordsText: item.keywords.join(", "),
    sortOrder: String(item.sortOrder),
    isVisible: item.isVisible,
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

export function SkillItemForm({
  mode,
  groupOptions,
  defaultGroupId,
  item,
}: SkillItemFormProps) {
  const formId =
    mode === "create"
      ? `skill-item-create-${defaultGroupId ?? "new"}`
      : `skill-item-${item.id}`
  const initialValues =
    mode === "create"
      ? getEmptyValues(groupOptions, defaultGroupId)
      : itemToValues(item)
  const action =
    mode === "create"
      ? createSkillItemAction
      : updateSkillItemAction.bind(null, item.id)
  const [state, formAction, pending] = useActionState<SkillItemFormState, FormData>(
    action,
    {
      message: "",
      values: initialValues,
    }
  )
  const values = state.values ?? initialValues
  const alertVariant = state.success ? "default" : "destructive"
  const fieldsDisabled = pending || groupOptions.length === 0

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
        <Field data-invalid={Boolean(state.fieldErrors?.groupId)}>
          <FieldLabel htmlFor={`${formId}-groupId`}>所属分组</FieldLabel>
          <NativeSelect
            id={`${formId}-groupId`}
            name="groupId"
            defaultValue={values.groupId}
            aria-invalid={Boolean(state.fieldErrors?.groupId)}
            disabled={fieldsDisabled}
          >
            {groupOptions.length === 0 ? (
              <option value="">暂无可用分组</option>
            ) : null}
            {groupOptions.map((groupOption) => (
              <option key={groupOption.id} value={groupOption.id}>
                {groupOption.label}
              </option>
            ))}
          </NativeSelect>
          <FieldError>{state.fieldErrors?.groupId}</FieldError>
        </Field>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextInputField
            formId={formId}
            name="name"
            label="技能名称"
            value={values.name}
            error={state.fieldErrors?.name}
            disabled={fieldsDisabled}
            placeholder="Next.js"
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

        <Field data-invalid={Boolean(state.fieldErrors?.level)}>
          <FieldLabel htmlFor={`${formId}-level`}>熟练度</FieldLabel>
          <NativeSelect
            id={`${formId}-level`}
            name="level"
            defaultValue={values.level}
            aria-invalid={Boolean(state.fieldErrors?.level)}
            disabled={fieldsDisabled}
          >
            <option value="">未设置</option>
            <option value="familiar">{skillLevelLabels.familiar}</option>
            <option value="proficient">{skillLevelLabels.proficient}</option>
            <option value="expert">{skillLevelLabels.expert}</option>
          </NativeSelect>
          <FieldDescription>
            建议只在公开简历需要区分层级时填写。
          </FieldDescription>
          <FieldError>{state.fieldErrors?.level}</FieldError>
        </Field>

        <Field data-invalid={Boolean(state.fieldErrors?.keywordsText)}>
          <FieldLabel htmlFor={`${formId}-keywordsText`}>关键词</FieldLabel>
          <Textarea
            id={`${formId}-keywordsText`}
            name="keywordsText"
            defaultValue={values.keywordsText}
            placeholder="RSC, Server Actions, React Compiler"
            maxLength={1000}
            aria-invalid={Boolean(state.fieldErrors?.keywordsText)}
            disabled={fieldsDisabled}
          />
          <FieldDescription>使用逗号或换行分隔多个关键词。</FieldDescription>
          <FieldError>{state.fieldErrors?.keywordsText}</FieldError>
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
              关闭后技能项保留在后台，但不会出现在公开简历中。
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
          {pending ? "正在保存" : mode === "create" ? "创建技能项" : "保存技能项"}
        </Button>
      </div>
    </form>
  )
}
