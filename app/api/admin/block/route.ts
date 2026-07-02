import { NextResponse } from "next/server"
import { createAdminBlock, ReservationConflictError, ReservationValidationError } from "@/lib/reservations"

export const runtime = "nodejs"

interface AdminBlockRequestBody {
  apartmentId?: unknown
  startDate?: unknown
  endDate?: unknown
  note?: unknown
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AdminBlockRequestBody | null

  if (!body) {
    return NextResponse.json({ error: "Neplatná data formuláře." }, { status: 400 })
  }

  const apartmentId = Number(body.apartmentId)
  const startDate = typeof body.startDate === "string" ? body.startDate : ""
  const endDate = typeof body.endDate === "string" ? body.endDate : ""
  const note = typeof body.note === "string" ? body.note : undefined

  if (!Number.isInteger(apartmentId) || !startDate || !endDate) {
    return NextResponse.json({ error: "Vyplňte apartmán a termín." }, { status: 422 })
  }

  try {
    const reservation = await createAdminBlock({ apartmentId, startDate, endDate, note })
    return NextResponse.json({ reservation })
  } catch (error) {
    if (error instanceof ReservationValidationError || error instanceof ReservationConflictError) {
      return NextResponse.json({ error: error.message }, { status: error instanceof ReservationConflictError ? 409 : 422 })
    }

    console.error("Failed to create admin block", error)
    return NextResponse.json({ error: "Blokaci se nepodařilo vytvořit." }, { status: 500 })
  }
}
