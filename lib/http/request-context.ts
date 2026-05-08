import { headers } from "next/headers"

import { sha256Hex } from "@/lib/auth/crypto"
import type { RequestAuditContext } from "@/lib/services/admin-audit-service"

export async function getRequestAuditContext(): Promise<RequestAuditContext> {
  const headerStore = await headers()
  const forwardedFor = headerStore.get("x-forwarded-for")
  const realIp = headerStore.get("x-real-ip")
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp?.trim()
  const userAgent = headerStore.get("user-agent")?.slice(0, 500) ?? null

  return {
    ipHash: ip ? sha256Hex(ip) : null,
    userAgent,
  }
}
