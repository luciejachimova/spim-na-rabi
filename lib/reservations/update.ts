import { prisma } from "../db"
import { ReservationConflictError, ReservationNotFoundError, ReservationValidationError } from "./errors"
import { mapRawReservationRow } from "./mappers"
import { getApartmentById } from "./queries"
import type { RawReservationRow, ReservationWithApartment, UpdateReservationInput } from "./types"
import { areDatesValid, parseDateOnly, validateEmailFormat, validateGuestsCount } from "./validation"

// Same atomic-statement pattern as insertReservationAtomic — folds the
// "no other active reservation overlaps" check and the write into one
// statement so an edit can't race a concurrent booking into a conflict.
export async function updateReservation(
  reservationId: number,
  input: UpdateReservationInput
): Promise<ReservationWithApartment> {
  const startDate = parseDateOnly(input.startDate)
  const endDate = parseDateOnly(input.endDate)

  if (!areDatesValid(startDate, endDate)) {
    throw new ReservationValidationError("Odjezd musí být po příjezdu.")
  }

  const apartment = await getApartmentById(input.apartmentId)
  if (!apartment) {
    throw new ReservationValidationError("Apartmán nebyl nalezen.")
  }

  const name = input.name?.trim() || null
  const email = input.email?.trim() || null
  const phone = input.phone?.trim() || null
  const note = input.note?.trim() || null
  const guests = input.guests ?? null

  if (email) {
    validateEmailFormat(email)
  }
  if (guests !== null) {
    validateGuestsCount(guests)
  }

  const rows = await prisma.$queryRaw<RawReservationRow[]>`
    UPDATE reservations
    SET
      apartment_id = ${apartment.id},
      start_date = ${startDate},
      end_date = ${endDate},
      name = ${name},
      email = ${email},
      phone = ${phone},
      guests = ${guests},
      note = ${note},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${reservationId}
      AND NOT EXISTS (
        SELECT 1 FROM reservations
        WHERE apartment_id = ${apartment.id}
          AND status = 'active'
          AND id != ${reservationId}
          AND start_date < ${endDate}
          AND end_date > ${startDate}
      )
    RETURNING *
  `

  const row = rows[0]
  if (!row) {
    const existing = await prisma.reservation.findUnique({ where: { id: reservationId } })
    if (!existing) {
      throw new ReservationNotFoundError("Rezervace nebyla nalezena.")
    }
    throw new ReservationConflictError("Vybraný termín je už obsazený.")
  }

  return mapRawReservationRow(row, apartment)
}
