import { NextRequest, NextResponse } from "next/server"
import { ADMIN_SESSION_COOKIE, verifySessionCookieValue } from "@/lib/admin-auth"

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next()
  }

  const cookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const valid = await verifySessionCookieValue(cookie)

  if (valid) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Neoprávněný přístup." }, { status: 401 })
  }

  return NextResponse.redirect(new URL("/admin/login", request.url))
}
