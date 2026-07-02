import { NextResponse } from "next/server"
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS, createSessionCookieValue } from "@/lib/admin-auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null
  const password = typeof body?.password === "string" ? body.password : ""

  const expected = process.env.ADMIN_PASSWORD
  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Nesprávné heslo." }, { status: 401 })
  }

  const response = NextResponse.json({ message: "Přihlášení úspěšné." })
  response.cookies.set(ADMIN_SESSION_COOKIE, await createSessionCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS
  })

  return response
}
