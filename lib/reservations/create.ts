import { Prisma } from "@prisma/client"
import { prisma } from "../db"
import { ReservationConflictError, ReservationValidationError } from "./errors"
import { findOrCreateGuest } from "./guests"
import { mapRawReservationRow } from "./mappers"
import { getApartmentById, getApartmentBySelection, listApartments } from "./queries"
import { BLOCKING_STATUSES } from "./status"
import type {
  AdminBlockInput,
  ApartmentRecord,
  ManualReservationInput,
  RawReservationRow,
  ReservationSource,
  ReservationStatus,
  ReservationWithApartment,
  WebsiteReservationInput
} from "./types"
import { areDatesValid, parseDateOnly, validateEmailFormat, validateGuestsCount, validateOccupancy, validatePrice } from "./validation"

interface AtomicInsertPayload {
  apartmentId: number
  startDate: string
  endDate: string
  source: ReservationSource
  status: ReservationStatus
  externalUid: string | null
  name: string | null
  email: string | null
  phone: string | null
  adults: number
  children: number
  childrenAges: string | null
  hasDog: boolean
  dogsCount: number
  priceCents: number | null
  currency: string
  depositCents: number | null
  isPaid: boolean
  note: string | null
  guestNote: string | null
  arrivalTime: string | null
  departureTime: string | null
  locale: string
}

// Folds the overlap check and the write into one atomic SQL statement so two
// concurrent requests for overlapping dates can't both pass the check before
// either commits (a plain check-then-insert, even inside a Prisma interactive
// transaction, is not safe on SQLite).
//
// Returns null when the nights were already taken — the caller decides whether
// that means "try the next apartment" or "report a conflict".
async function insertReservationAtomic(
  payload: AtomicInsertPayload,
  apartment: Pick<ApartmentRecord, "slug" | "name">
): Promise<ReservationWithApartment | null> {
  // `guests` is the legacy total column, kept as adults + children until it can
  // be dropped (see the note on the model in schema.prisma). Only written here.
  const legacyGuestTotal = payload.adults + payload.children

  const rows = await prisma.$queryRaw<RawReservationRow[]>`
    INSERT INTO reservations (
      apartment_id, start_date, end_date, source, status, external_uid,
      name, email, phone, guests, adults, children, children_ages,
      has_dog, dogs_count, price_cents, currency, deposit_cents, is_paid,
      note, guest_note, arrival_time, departure_time, locale,
      reservation_token, created_at, updated_at
    )
    SELECT
      ${payload.apartmentId}, ${payload.startDate}, ${payload.endDate}, ${payload.source}, ${payload.status}, ${payload.externalUid},
      ${payload.name}, ${payload.email}, ${payload.phone}, ${legacyGuestTotal}, ${payload.adults}, ${payload.children}, ${payload.childrenAges},
      ${payload.hasDog}, ${payload.dogsCount}, ${payload.priceCents}, ${payload.currency}, ${payload.depositCents}, ${payload.isPaid},
      ${payload.note}, ${payload.guestNote}, ${payload.arrivalTime}, ${payload.departureTime}, ${payload.locale},
      ${crypto.randomUUID()}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    WHERE NOT EXISTS (
      SELECT 1 FROM reservations
      WHERE apartment_id = ${payload.apartmentId}
        AND status IN (${Prisma.join(BLOCKING_STATUSES)})
        AND start_date < ${payload.endDate}
        AND end_date > ${payload.startDate}
    )
    RETURNING *
  `

  const row = rows[0]
  return row ? mapRawReservationRow(row, apartment) : null
}

// Defaults for the fields the public site and admin blocks don't collect.
const EMPTY_DETAILS = {
  childrenAges: null,
  hasDog: false,
  dogsCount: 0,
  priceCents: null,
  currency: "CZK",
  depositCents: null,
  isPaid: false,
  guestNote: null,
  arrivalTime: null,
  departureTime: null
} as const

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
        ...EMPTY_DETAILS,
        apartmentId: apartment.id,
        startDate,
        endDate,
        source: "website",
        status: "confirmed",
        externalUid: null,
        name,
        email,
        phone,
        // The public booking form still asks for a single guest total; it is
        // recorded as adults until that form learns the adults/children split.
        adults: guests,
        children: 0,
        note,
        locale
      },
      apartment
    )

    if (reservation) {
      await linkGuest(reservation.id, { name, email, phone })
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
      ...EMPTY_DETAILS,
      apartmentId: apartment.id,
      startDate,
      endDate,
      source: "admin_block",
      status: "confirmed",
      externalUid: null,
      name: null,
      email: null,
      phone: null,
      adults: 0,
      children: 0,
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

// Linking to the address book is a second write on purpose: keeping it out of
// the atomic statement keeps that statement about one thing — not
// double-booking. A failure to link must never lose the reservation, so it is
// logged rather than thrown.
async function linkGuest(reservationId: number, identity: { name?: string | null; email?: string | null; phone?: string | null }) {
  try {
    const guestId = await findOrCreateGuest(identity)
    if (guestId) {
      await prisma.reservation.update({ where: { id: reservationId }, data: { guestId } })
    }
  } catch (error) {
    console.error("Failed to link reservation to a guest", { reservationId, error })
  }
}

/**
 * Owner-created reservation from the manager UI: everything the phone call or
 * the e-mail contained, including price and dog.
 */
export async function createManualReservation(input: ManualReservationInput): Promise<ReservationWithApartment> {
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

  if (email) {
    validateEmailFormat(email)
  }

  const occupancy = validateOccupancy({
    adults: input.adults,
    children: input.children,
    hasDog: input.hasDog,
    dogsCount: input.dogsCount,
    isBlock: input.source === "admin_block"
  })
  const priceCents = validatePrice(input.priceCents)
  const depositCents = validatePrice(input.depositCents)

  const reservation = await insertReservationAtomic(
    {
      apartmentId: apartment.id,
      startDate,
      endDate,
      source: input.source,
      status: input.status,
      externalUid: null,
      name,
      email,
      phone,
      adults: occupancy.adults,
      children: occupancy.children,
      childrenAges: input.childrenAges?.trim() || null,
      hasDog: occupancy.hasDog,
      dogsCount: occupancy.dogsCount,
      priceCents,
      currency: input.currency || "CZK",
      depositCents,
      isPaid: input.isPaid ?? false,
      note: input.note?.trim() || null,
      guestNote: input.guestNote?.trim() || null,
      arrivalTime: input.arrivalTime?.trim() || null,
      departureTime: input.departureTime?.trim() || null,
      locale: input.locale || "cs"
    },
    apartment
  )

  if (!reservation) {
    throw new ReservationConflictError("Vybraný termín je už obsazený.")
  }

  await linkGuest(reservation.id, { name, email, phone })
  return reservation
}
