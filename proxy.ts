import { NextResponse, type NextRequest } from "next/server"

import { ADMIN_SESSION_COOKIE } from "@/lib/auth/constants"

export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies.has(ADMIN_SESSION_COOKIE)

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    )
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/admin/:path*",
}
