import { NextResponse } from "next/server"
import { syncAllApartments } from "@/lib/reservations"

export const runtime = "nodejs"

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return true
  }

  const header = request.headers.get("authorization") || request.headers.get("x-cron-secret")
  return header === `Bearer ${secret}` || header === secret
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Neoprávněný přístup." }, { status: 401 })
  }

  const result = await syncAllApartments()
  return NextResponse.json(result)
}
