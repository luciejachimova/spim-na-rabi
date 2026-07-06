import { NextResponse } from "next/server"
import {
  cancelReservation,
  deleteReservationPermanently,
  updateReservation,
  ReservationConflictError,
  ReservationNotFoundError,
  ReservationValidationError
} from "@/lib/reservations"

export const runtime = "nodejs"

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

interface UpdateReservationRequestBody {
  apartmentId?: unknown
  startDate?: unknown
  endDate?: unknown
  name?: unknown
  email?: unknown
  phone?: unknown
  guests?: unknown
  note?: unknown
}

function parseReservationId(id: string) {
  const reservationId = Number(id)
  return Number.isInteger(reservationId) ? reservationId : null
}

export async function PATCH(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const reservationId = parseReservationId(id)

  if (reservationId === null) {
    return NextResponse.json({ error: "Neplatné ID rezervace." }, { status: 400 })
  }

  try {
    const reservation = await cancelReservation(reservationId)
    return NextResponse.json({ reservation })
  } catch (error) {
    if (error instanceof ReservationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    console.error("Failed to cancel reservation", error)
    return NextResponse.json({ error: "Rezervaci se nepodařilo zrušit." }, { status: 500 })
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params
  const reservationId = parseReservationId(id)

  if (reservationId === null) {
    return NextResponse.json({ error: "Neplatné ID rezervace." }, { status: 400 })
  }

  const body = (await request.json().catch(() => null)) as UpdateReservationRequestBody | null
  const apartmentId = Number(body?.apartmentId)
  const startDate = typeof body?.startDate === "string" ? body.startDate : ""
  const endDate = typeof body?.endDate === "string" ? body.endDate : ""

  if (!Number.isInteger(apartmentId) || !startDate || !endDate) {
    return NextResponse.json({ error: "Vyplňte apartmán a termín." }, { status: 422 })
  }

  try {
    const reservation = await updateReservation(reservationId, {
      apartmentId,
      startDate,
      endDate,
      name: typeof body?.name === "string" ? body.name : null,
      email: typeof body?.email === "string" ? body.email : null,
      phone: typeof body?.phone === "string" ? body.phone : null,
      guests: typeof body?.guests === "number" ? body.guests : body?.guests ? Number(body.guests) : null,
      note: typeof body?.note === "string" ? body.note : null
    })
    return NextResponse.json({ reservation })
  } catch (error) {
    if (error instanceof ReservationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error instanceof ReservationValidationError || error instanceof ReservationConflictError) {
      return NextResponse.json({ error: error.message }, { status: error instanceof ReservationConflictError ? 409 : 422 })
    }

    console.error("Failed to update reservation", error)
    return NextResponse.json({ error: "Rezervaci se nepodařilo upravit." }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const reservationId = parseReservationId(id)

  if (reservationId === null) {
    return NextResponse.json({ error: "Neplatné ID rezervace." }, { status: 400 })
  }

  try {
    await deleteReservationPermanently(reservationId)
    return NextResponse.json({ message: "Rezervace byla smazána." })
  } catch (error) {
    if (error instanceof ReservationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    console.error("Failed to delete reservation", error)
    return NextResponse.json({ error: "Rezervaci se nepodařilo smazat." }, { status: 500 })
  }
}
