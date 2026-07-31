import { NextResponse } from "next/server"
import { isBlocking, listApartments, listReservationsForApartment } from "@/lib/reservations"

export const runtime = "nodejs"

// Public, unauthenticated: exposes only which date ranges are taken, never
// guest names/emails, so the reservation calendar can render availability.
export async function GET() {
  const apartments = await listApartments()

  const results = await Promise.all(
    apartments.map(async (apartment) => {
      const reservations = await listReservationsForApartment(apartment.id)
      return {
        slug: apartment.slug,
        busyRanges: reservations
          .filter((reservation) => isBlocking(reservation.status))
          .map((reservation) => ({ start: reservation.startDate, end: reservation.endDate }))
      }
    })
  )

  return NextResponse.json({ apartments: results })
}
