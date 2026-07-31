import { Prisma } from "@prisma/client"
import { onReservationDatesChanged } from "../cleaning/hooks"
import { prisma } from "../db"
import { ReservationConflictError, ReservationNotFoundError, ReservationValidationError } from "./errors"
import { findOrCreateGuest } from "./guests"
import { mapRawReservationRow } from "./mappers"
import { getApartmentById } from "./queries"
import { BLOCKING_STATUSES_FOR_READ } from "./status"
import type { RawReservationRow, ReservationWithApartment, UpdateReservationInput } from "./types"
import { areDatesValid, parseDateOnly, validateEmailFormat, validateGuestsCount, validateOccupancy, validatePrice } from "./validation"

// Same atomic-statement pattern as insertReservationAtomic — folds the "no
// other blocking reservation overlaps" check and the write into one statement
// so an edit can't race a concurrent booking into a conflict.
//
// manual_edited_at is what makes an owner's edit visible to the iCal importer:
// for a Booking/Airbnb row the next sync must leave everything typed here
// alone (see lib/ical/import.ts).
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

  const existing = await prisma.reservation.findUnique({ where: { id: reservationId } })
  if (!existing) {
    throw new ReservationNotFoundError("Rezervace nebyla nalezena.")
  }

  // "Absent means keep" applies to the contact fields too. Reading them as
  // `input.x?.trim() || null` would blank out a stored phone number whenever a
  // caller sent only the dates — which is exactly what the older admin API
  // does. Passing an explicit null is still how you clear a field.
  const name = input.name === undefined ? existing.name : input.name?.trim() || null
  const email = input.email === undefined ? existing.email : input.email?.trim() || null
  const phone = input.phone === undefined ? existing.phone : input.phone?.trim() || null
  const note = input.note === undefined ? existing.note : input.note?.trim() || null

  if (email) {
    validateEmailFormat(email)
  }

  // The admin API predates adults/children and still sends `guests`; the
  // manager form sends the split. Whichever arrives, one code path follows.
  const adultsInput = input.adults ?? input.guests ?? existing.adults
  const childrenInput = input.children ?? (input.adults !== undefined || input.guests !== undefined ? 0 : existing.children)

  if (input.guests !== undefined && input.guests !== null && input.adults === undefined) {
    validateGuestsCount(input.guests)
  }

  const occupancy = validateOccupancy({
    adults: adultsInput ?? 0,
    children: childrenInput ?? 0,
    hasDog: input.hasDog ?? existing.hasDog,
    dogsCount: input.dogsCount ?? existing.dogsCount,
    isBlock: existing.source === "admin_block"
  })

  const priceCents = input.priceCents === undefined ? existing.priceCents : validatePrice(input.priceCents)
  const depositCents = input.depositCents === undefined ? existing.depositCents : validatePrice(input.depositCents)
  const status = input.status ?? existing.status
  const source = input.source ?? existing.source
  const isPaid = input.isPaid ?? existing.isPaid
  const currency = input.currency ?? existing.currency
  const childrenAges = input.childrenAges === undefined ? existing.childrenAges : input.childrenAges?.trim() || null
  const guestNote = input.guestNote === undefined ? existing.guestNote : input.guestNote?.trim() || null
  const arrivalTime = input.arrivalTime === undefined ? existing.arrivalTime : input.arrivalTime?.trim() || null
  const departureTime = input.departureTime === undefined ? existing.departureTime : input.departureTime?.trim() || null

  // Cancelling through the form must leave the same trail as cancelReservation.
  const isBecomingCancelled = status === "cancelled" && existing.status !== "cancelled"
  const isBecomingActive = status !== "cancelled" && existing.status === "cancelled"

  const rows = await prisma.$queryRaw<RawReservationRow[]>`
    UPDATE reservations
    SET
      apartment_id = ${apartment.id},
      start_date = ${startDate},
      end_date = ${endDate},
      source = ${source},
      status = ${status},
      name = ${name},
      email = ${email},
      phone = ${phone},
      guests = ${occupancy.adults + occupancy.children},
      adults = ${occupancy.adults},
      children = ${occupancy.children},
      children_ages = ${childrenAges},
      has_dog = ${occupancy.hasDog},
      dogs_count = ${occupancy.dogsCount},
      price_cents = ${priceCents},
      currency = ${currency},
      deposit_cents = ${depositCents},
      is_paid = ${isPaid},
      note = ${note},
      guest_note = ${guestNote},
      arrival_time = ${arrivalTime},
      departure_time = ${departureTime},
      cancelled_at = ${isBecomingCancelled ? new Date().toISOString() : isBecomingActive ? null : existing.cancelledAt},
      cancel_reason = ${isBecomingCancelled ? (input.cancelReason?.trim() || "manual") : isBecomingActive ? null : existing.cancelReason},
      manual_edited_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${reservationId}
      AND NOT EXISTS (
        SELECT 1 FROM reservations
        WHERE apartment_id = ${apartment.id}
          AND status IN (${Prisma.join(BLOCKING_STATUSES_FOR_READ)})
          AND id != ${reservationId}
          AND start_date < ${endDate}
          AND end_date > ${startDate}
      )
    RETURNING *
  `

  const row = rows[0]
  if (!row) {
    throw new ReservationConflictError("Vybraný termín je už obsazený.")
  }

  if (name || email || phone) {
    try {
      const guestId = await findOrCreateGuest({ name, email, phone })
      if (guestId && guestId !== existing.guestId) {
        await prisma.reservation.update({ where: { id: reservationId }, data: { guestId } })
      }
    } catch (error) {
      console.error("Failed to link reservation to a guest", { reservationId, error })
    }
  }

  if (existing.startDate !== startDate || existing.endDate !== endDate) {
    await onReservationDatesChanged({
      reservationId,
      apartmentId: apartment.id,
      previousStartDate: existing.startDate,
      previousEndDate: existing.endDate,
      startDate,
      endDate
    })
  }

  return mapRawReservationRow(row, apartment)
}
