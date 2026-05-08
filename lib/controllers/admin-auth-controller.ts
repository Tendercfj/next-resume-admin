"use server"

import { redirect } from "next/navigation"

import {
  revokeCurrentAdminSession,
  setAdminSessionCookie,
} from "@/lib/auth/session"
import { getRequestAuditContext } from "@/lib/http/request-context"
import {
  loginAdmin,
  recordAdminLogout,
} from "@/lib/services/admin-auth-service"

export type LoginFormState = {
  message: string
  fieldErrors?: {
    email?: string
    password?: string
  }
}

function readString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

function validateLoginForm(formData: FormData) {
  const email = readString(formData.get("email")).toLowerCase()
  const password = readString(formData.get("password"))
  const fieldErrors: LoginFormState["fieldErrors"] = {}

  if (!email) {
    fieldErrors.email = "请输入管理员邮箱"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "请输入有效的邮箱地址"
  }

  if (!password) {
    fieldErrors.password = "请输入密码"
  } else if (password.length > 256) {
    fieldErrors.password = "密码长度不正确"
  }

  return {
    email,
    password,
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  }
}

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const { email, password, fieldErrors, isValid } = validateLoginForm(formData)

  if (!isValid) {
    return {
      message: "请检查邮箱和密码",
      fieldErrors,
    }
  }

  let shouldRedirect = false

  try {
    const context = await getRequestAuditContext()
    const result = await loginAdmin({ email, password, context })

    if (!result.ok) {
      return { message: result.message }
    }

    await setAdminSessionCookie(result.token, result.expiresAt)
    shouldRedirect = true
  } catch {
    return {
      message: "登录暂时不可用，请稍后再试",
    }
  }

  if (shouldRedirect) {
    redirect("/admin")
  }

  return {
    message: "登录暂时不可用，请稍后再试",
  }
}

export async function logoutAction() {
  const context = await getRequestAuditContext()
  const adminUserId = await revokeCurrentAdminSession()

  if (adminUserId) {
    await recordAdminLogout(adminUserId, context)
  }

  redirect("/login")
}
