import { prisma } from "../db"
import { ReservationConflictError, ReservationValidationError } from "./errors"
import { mapRawReservationRow } from "./mappers"
import { getApartmentById, getApartmentBySelection, listApartments } from "./queries"
import type { AdminBlockInput, ApartmentRecord, RawReservationRow, ReservationSource, WebsiteReservationInput } from "./types"
import { areDatesValid, parseDateOnly, validateEmailFormat, validateGuestsCount } from "./validation"
import type { ReservationWithApartment } from "./types"

interface AtomicInsertPayload {
  apartmentId: number
  startDate: string
  endDate: string
  source: ReservationSource
  externalUid: string | null
  name: string | null
  email: string | null
  phone: string | null
  guests: number | null
  note: string | null
  locale: string
}

// Folds the overlap check and the write into one atomic SQL statement so two
// concurrent requests for overlapping dates can't both pass the check before
// either commits (a plain check-then-insert, even inside a Prisma interactive
// transaction, is not safe on SQLite — see the migration plan for why).
async function insertReservationAtomic(
  payload: AtomicInsertPayload,
  apartment: Pick<ApartmentRecord, "slug" | "name">
): Promise<ReservationWithApartment | null> {
  const rows = await prisma.$queryRaw<RawReservationRow[]>`
    INSERT INTO reservations (
      apartment_id, start_date, end_date, source, status, external_uid,
      name, email, phone, guests, note, locale, reservation_token, created_at, updated_at
    )
    SELECT
      ${payload.apartmentId}, ${payload.startDate}, ${payload.endDate}, ${payload.source}, 'active', ${payload.externalUid},
      ${payload.name}, ${payload.email}, ${payload.phone}, ${payload.guests}, ${payload.note}, ${payload.locale}, ${crypto.randomUUID()}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    WHERE NOT EXISTS (
      SELECT 1 FROM reservations
      WHERE apartment_id = ${payload.apartmentId}
        AND status = 'active'
        AND start_date < ${payload.endDate}
        AND end_date > ${payload.startDate}
    )
    RETURNING *
  `

  const row = rows[0]
  return row ? mapRawReservationRow(row, apartment) : null
}

export async function createWebsiteReservation(input: WebsiteReservationInput) {
  const name = input.name.trim()
  const email = input.email.trim()
  const phone = input.phone?.trim() || null
  const note = input.note?.trim() || null
  const guests = Number(input.guests)
  const locale = input.locale || "cs"

  if (!name) {
    throw new ReservationValidationError("Jméno je povinné.", "nameRequired")
  }

  if (!email) {
    throw new ReservationValidationError("Email je povinný.", "emailRequired")
  }

  validateEmailFormat(email)
  validateGuestsCount(guests)

  const startDate = parseDateOnly(input.startDate)
  const endDate = parseDateOnly(input.endDate)

  if (!areDatesValid(startDate, endDate)) {
    throw new ReservationValidationError("Odjezd musí být po příjezdu.", "datesInvalid")
  }

  const isAnySelection = !input.apartmentSelection || input.apartmentSelection === "any"

  const candidates = isAnySelection
    ? await listApartments()
    : await getApartmentBySelection(input.apartmentSelection).then((apartment) => (apartment ? [apartment] : []))

  for (const apartment of candidates) {
    const reservation = await insertReservationAtomic(
      {
        apartmentId: apartment.id,
        startDate,
        endDate,
        source: "website",
        externalUid: null,
        name,
        email,
        phone,
        guests,
        note,
        locale
      },
      apartment
    )

    if (reservation) {
      return { reservation, apartment }
    }
  }

  throw new ReservationConflictError(
    isAnySelection ? "V daném termínu není volný žádný apartmán." : "Vybraný termín je už obsazený.",
    isAnySelection ? "noApartmentFree" : "slotTaken"
  )
}

export async function createAdminBlock(input: AdminBlockInput) {
  const startDate = parseDateOnly(input.startDate)
  const endDate = parseDateOnly(input.endDate)

  if (!areDatesValid(startDate, endDate)) {
    throw new ReservationValidationError("Odjezd musí být po příjezdu.")
  }

  const apartment = await getApartmentById(input.apartmentId)
  if (!apartment) {
    throw new ReservationValidationError("Apartmán nebyl nalezen.")
  }

  const reservation = await insertReservationAtomic(
    {
      apartmentId: apartment.id,
      startDate,
      endDate,
      source: "admin_block",
      externalUid: null,
      name: null,
      email: null,
      phone: null,
      guests: null,
      note: input.note?.trim() || null,
      locale: "cs"
    },
    apartment
  )

  if (!reservation) {
    throw new ReservationConflictError("Vybraný termín je už obsazený.")
  }

  return reservation
}
