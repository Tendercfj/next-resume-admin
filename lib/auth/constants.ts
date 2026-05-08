export const ADMIN_SESSION_COOKIE = "resume_admin_session"
export const LOGIN_ERROR_MESSAGE = "邮箱或密码不正确"
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export const ADMIN_ROLES = ["owner", "editor", "viewer"] as const

export type AdminRole = (typeof ADMIN_ROLES)[number]
