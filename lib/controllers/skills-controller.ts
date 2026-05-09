"use server"

import { revalidatePath } from "next/cache"

import { assertAdminRole, requireAdmin } from "@/lib/auth/guards"
import { getRequestAuditContext } from "@/lib/http/request-context"
import {
  createManagedSkillGroup,
  createManagedSkillItem,
  deleteManagedSkillGroup,
  deleteManagedSkillItem,
  getResumeReferences,
  getSkillGroupsWithItems,
  updateManagedSkillGroup,
  updateManagedSkillItem,
  type ResumeReference,
  type SkillGroup,
  type SkillGroupFieldErrors,
  type SkillGroupInput,
  type SkillItemFieldErrors,
  type SkillItemInput,
} from "@/lib/services/skills-service"

const MANAGE_SKILL_ROLES = ["owner", "editor"] as const

export type SkillGroupFormValues = SkillGroupInput
export type SkillItemFormValues = SkillItemInput

export type SkillGroupFormState = {
  message: string
  success?: boolean
  resetKey?: number
  values?: SkillGroupFormValues
  fieldErrors?: SkillGroupFieldErrors
}

export type SkillItemFormState = {
  message: string
  success?: boolean
  resetKey?: number
  values?: SkillItemFormValues
  fieldErrors?: SkillItemFieldErrors
}

export type DeleteSkillGroupFormState = {
  message: string
  success?: boolean
}

export type DeleteSkillItemFormState = {
  message: string
  success?: boolean
}

export type SkillsPageData =
  | {
      accessDenied: false
      resumes: ResumeReference[]
      groups: SkillGroup[]
    }
  | {
      accessDenied: true
      resumes: []
      groups: []
    }

function readString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

function readSkillGroupFormValues(formData: FormData): SkillGroupFormValues {
  return {
    resumeId: readString(formData.get("resumeId")),
    name: readString(formData.get("name")),
    description: readString(formData.get("description")),
    sortOrder: readString(formData.get("sortOrder")) || "0",
    isVisible: formData.get("isVisible") === "on",
  }
}

function readSkillItemFormValues(formData: FormData): SkillItemFormValues {
  return {
    groupId: readString(formData.get("groupId")),
    name: readString(formData.get("name")),
    level: readString(formData.get("level")),
    keywordsText: readString(formData.get("keywordsText")),
    sortOrder: readString(formData.get("sortOrder")) || "0",
    isVisible: formData.get("isVisible") === "on",
  }
}

async function requireSkillManager() {
  const admin = await requireAdmin()
  assertAdminRole(admin.role, MANAGE_SKILL_ROLES)
  return admin
}

function toSkillGroupFormState(
  result: Awaited<ReturnType<typeof createManagedSkillGroup>>,
  values: SkillGroupFormValues
): SkillGroupFormState {
  if (!result.ok) {
    return {
      message: result.message,
      success: false,
      values,
      fieldErrors: result.fieldErrors,
    }
  }

  return {
    message: result.message,
    success: true,
    resetKey: Date.now(),
  }
}

function toSkillItemFormState(
  result: Awaited<ReturnType<typeof createManagedSkillItem>>,
  values: SkillItemFormValues
): SkillItemFormState {
  if (!result.ok) {
    return {
      message: result.message,
      success: false,
      values,
      fieldErrors: result.fieldErrors,
    }
  }

  return {
    message: result.message,
    success: true,
    resetKey: Date.now(),
  }
}

export async function getSkillsPageData(): Promise<SkillsPageData> {
  const admin = await requireAdmin()

  if (admin.role !== "owner" && admin.role !== "editor") {
    return {
      accessDenied: true,
      resumes: [],
      groups: [],
    }
  }

  const [resumes, groups] = await Promise.all([
    getResumeReferences(),
    getSkillGroupsWithItems(),
  ])

  return {
    accessDenied: false,
    resumes,
    groups,
  }
}

export async function createSkillGroupAction(
  _prevState: SkillGroupFormState,
  formData: FormData
): Promise<SkillGroupFormState> {
  const admin = await requireSkillManager()
  const values = readSkillGroupFormValues(formData)
  const context = await getRequestAuditContext()
  const result = await createManagedSkillGroup(values, admin, context)

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/skills")
  }

  return toSkillGroupFormState(result, values)
}

export async function updateSkillGroupAction(
  groupId: string,
  _prevState: SkillGroupFormState,
  formData: FormData
): Promise<SkillGroupFormState> {
  const admin = await requireSkillManager()
  const values = readSkillGroupFormValues(formData)
  const context = await getRequestAuditContext()
  const result = await updateManagedSkillGroup(groupId, values, admin, context)

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/skills")
  }

  return toSkillGroupFormState(result, values)
}

export async function deleteSkillGroupAction(
  groupId: string,
  _prevState: DeleteSkillGroupFormState,
  _formData: FormData
): Promise<DeleteSkillGroupFormState> {
  void _prevState
  void _formData
  const admin = await requireSkillManager()
  const context = await getRequestAuditContext()
  const result = await deleteManagedSkillGroup(groupId, admin, context)

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/skills")
  }

  return {
    message: result.message,
    success: result.ok,
  }
}

export async function createSkillItemAction(
  _prevState: SkillItemFormState,
  formData: FormData
): Promise<SkillItemFormState> {
  const admin = await requireSkillManager()
  const values = readSkillItemFormValues(formData)
  const context = await getRequestAuditContext()
  const result = await createManagedSkillItem(values, admin, context)

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/skills")
  }

  return toSkillItemFormState(result, values)
}

export async function updateSkillItemAction(
  itemId: string,
  _prevState: SkillItemFormState,
  formData: FormData
): Promise<SkillItemFormState> {
  const admin = await requireSkillManager()
  const values = readSkillItemFormValues(formData)
  const context = await getRequestAuditContext()
  const result = await updateManagedSkillItem(itemId, values, admin, context)

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/skills")
  }

  return toSkillItemFormState(result, values)
}

export async function deleteSkillItemAction(
  itemId: string,
  _prevState: DeleteSkillItemFormState,
  _formData: FormData
): Promise<DeleteSkillItemFormState> {
  void _prevState
  void _formData
  const admin = await requireSkillManager()
  const context = await getRequestAuditContext()
  const result = await deleteManagedSkillItem(itemId, admin, context)

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/admin/skills")
  }

  return {
    message: result.message,
    success: result.ok,
  }
}
