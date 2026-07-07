import { NextResponse } from "next/server"
import { sendLifecycleEmail, type EmailKind } from "@/lib/guest-emails"

export const runtime = "nodejs"

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

const VALID_KINDS: EmailKind[] = ["confirmation", "arrivalInfo", "departureReminder", "thankYou"]

function parseReservationId(id: string) {
  const reservationId = Number(id)
  return Number.isInteger(reservationId) ? reservationId : null
}

function isEmailKind(value: unknown): value is EmailKind {
  return typeof value === "string" && (VALID_KINDS as string[]).includes(value)
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  const reservationId = parseReservationId(id)

  if (reservationId === null) {
    return NextResponse.json({ error: "Neplatné ID rezervace." }, { status: 400 })
  }

  const body = (await request.json().catch(() => null)) as { kind?: unknown } | null

  if (!isEmailKind(body?.kind)) {
    return NextResponse.json({ error: "Neplatný typ e-mailu." }, { status: 422 })
  }

  const result = await sendLifecycleEmail(reservationId, body.kind, { force: true })

  if (!result.sent) {
    if (result.skipped === "no-email") {
      return NextResponse.json({ error: "Rezervace nemá vyplněný e-mail." }, { status: 422 })
    }
    return NextResponse.json({ error: result.error || "E-mail se nepodařilo odeslat." }, { status: 502 })
  }

  return NextResponse.json({ message: "E-mail byl znovu odeslán." })
}
