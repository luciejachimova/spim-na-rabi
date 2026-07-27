import { NextRequest, NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"
import { routing } from "@/i18n/routing"
import { ADMIN_SESSION_COOKIE, verifySessionCookieValue } from "@/lib/admin-auth"

// One proxy (Next.js 16's renamed middleware) handling two concerns:
//   1. Admin authentication for /admin and /api/admin — never localized.
//   2. next-intl locale routing/detection for the public site.
// Public API routes (/api/*, excluding /api/admin) pass through untouched.
const intlMiddleware = createMiddleware(routing)

export const config = {
  // Everything except Next internals and files with an extension (static
  // assets, /sitemap.xml, /robots.txt, /manifest.webmanifest, favicon…).
  // /api is intentionally included so admin API auth still runs here.
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"]
}

async function requireAdminSession(request: NextRequest) {
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin surfaces: authenticate, keep in Czech, skip localization.
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return requireAdminSession(request)
  }

  // Other API routes are not localized — let them run as-is.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Metadata images are extensionless routes, so they hit this matcher and the
  // "as-needed" prefix rule would 307 /cs/opengraph-image → /opengraph-image.
  // Next emits the prefixed URL in og:image, and social scrapers that don't
  // follow redirects would drop the preview image — serve them directly.
  if (pathname.endsWith("/opengraph-image") || pathname.endsWith("/twitter-image")) {
    return NextResponse.next()
  }

  // Public pages: locale detection + localized routing.
  return intlMiddleware(request)
}
