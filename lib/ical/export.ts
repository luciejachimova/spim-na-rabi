import ical from "ical-generator"
import { toUtcDate } from "../prague-date"
import { listReservationsForApartment } from "../reservations/queries"
import type { ApartmentRecord, ReservationSource } from "../reservations/types"

function describeReservationSource(source: ReservationSource) {
  switch (source) {
    case "booking":
      return "Rezervace z Booking.com"
    case "airbnb":
      return "Rezervace z Airbnb"
    case "admin_block":
      return "Blokováno majitelem"
    default:
      return "Rezervace vytvořená na webu"
  }
}

export async function buildApartmentIcal(apartment: ApartmentRecord) {
  const calendar = ical({
    name: `${apartment.name} - Spim na Rabí`,
    description: "Aktuální obsazenost apartmánu Spim na Rabí"
  })

  const reservations = await listReservationsForApartment(apartment.id)

  for (const reservation of reservations) {
    if (reservation.status !== "active") {
      continue
    }

    calendar.createEvent({
      id: `reservation-${reservation.id}`,
      start: toUtcDate(reservation.startDate),
      end: toUtcDate(reservation.endDate),
      allDay: true,
      summary: "Obsazeno",
      description: describeReservationSource(reservation.source)
    })
  }

  return calendar
}
