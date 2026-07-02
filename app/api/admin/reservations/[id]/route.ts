import { NextResponse } from "next/server"
import { cancelReservation, ReservationNotFoundError } from "@/lib/reservations"

export const runtime = "nodejs"

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const reservationId = Number(id)

  if (!Number.isInteger(reservationId)) {
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
