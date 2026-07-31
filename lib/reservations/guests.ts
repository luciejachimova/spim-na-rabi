import { prisma } from "../db"
import { formatDateForPrague } from "../prague-date"
import { countNights } from "./overlap"
import { isBlocking } from "./status"
import type { ReservationSource, ReservationStatus } from "./types"

// Normalised copies exist so "Novák@Email.cz " and "+420 777 123 456" match
// the rows already in the address book. The originals are kept as typed —
// what the guest wrote is what appears on their confirmation.
export function normalizeEmail(email: string | null | undefined) {
  const trimmed = email?.trim().toLowerCase()
  return trimmed || null
}

// Czech numbers are written half a dozen ways. Strip everything that isn't a
// digit, then assume a bare 9-digit number is Czech — that is what a local
// phone book contains and what the owner types.
export function normalizePhone(phone: string | null | undefined) {
  const digits = phone?.replace(/\D/g, "") ?? ""
  if (!digits) return null
  if (digits.length === 9) return `+420${digits}`
  if (digits.startsWith("00")) return `+${digits.slice(2)}`
  return phone?.trim().startsWith("+") ? `+${digits}` : `+${digits}`
}

export interface GuestIdentityInput {
  name?: string | null
  email?: string | null
  phone?: string | null
  country?: string | null
}

/**
 * Links a reservation to a person in the address book, creating them on first
 * sight. Matching is by normalised email first, then normalised phone —
 * an email is the stronger identifier because two family members often share
 * a phone but rarely a mailbox.
 *
 * Returns null when there is nothing to match on (blocks, and iCal imports
 * before the owner fills the contact in), which is why Reservation.guestId is
 * nullable.
 */
export async function findOrCreateGuest(input: GuestIdentityInput): Promise<string | null> {
  const name = input.name?.trim() || null
  const emailNorm = normalizeEmail(input.email)
  const phoneNorm = normalizePhone(input.phone)

  // A name on its own is not an identity. Matching on it would merge two
  // different Nováks; creating on it would add a new row every time an edit
  // sends the name without the contact details, quietly detaching the
  // reservation from the person it already belonged to. Both were observed.
  // No contact detail therefore means no address-book entry — the name still
  // shows on the reservation, and the guest appears here once a phone number
  // or an e-mail is known.
  if (!emailNorm && !phoneNorm) {
    return null
  }

  const existing = emailNorm
    ? await prisma.guest.findFirst({ where: { emailNorm } })
    : phoneNorm
      ? await prisma.guest.findFirst({ where: { phoneNorm } })
      : null

  if (existing) {
    // Fill in blanks without overwriting what is already known: a booking made
    // with only a phone number should not blank out a stored email.
    await prisma.guest.update({
      where: { id: existing.id },
      data: {
        name: name || existing.name,
        email: existing.email ?? input.email?.trim() ?? null,
        emailNorm: existing.emailNorm ?? emailNorm,
        phone: existing.phone ?? input.phone?.trim() ?? null,
        phoneNorm: existing.phoneNorm ?? phoneNorm,
        country: existing.country ?? input.country?.trim() ?? null
      }
    })
    return existing.id
  }

  const created = await prisma.guest.create({
    data: {
      name: name || input.email?.trim() || input.phone?.trim() || "Neznámý host",
      email: input.email?.trim() || null,
      emailNorm,
      phone: input.phone?.trim() || null,
      phoneNorm,
      country: input.country?.trim() || null
    }
  })

  return created.id
}

export interface GuestStay {
  reservationId: number
  apartmentName: string
  startDate: string
  endDate: string
  nights: number
  status: ReservationStatus
  source: ReservationSource
  priceCents: number | null
  currency: string
  adults: number
  children: number
  hasDog: boolean
  dogsCount: number
}

export interface GuestSummary {
  id: string
  name: string
  email: string | null
  phone: string | null
  country: string | null
  note: string | null
  isBlocked: boolean
  stayCount: number
  nightCount: number
  /** Sum of prices in haléře across non-cancelled stays. */
  totalCents: number
  currency: string
  firstStayDate: string | null
  lastStayDate: string | null
  isReturning: boolean
  hasUpcomingStay: boolean
}

function summarize(
  guest: {
    id: string
    name: string
    email: string | null
    phone: string | null
    country: string | null
    note: string | null
    isBlocked: boolean
  },
  stays: GuestStay[]
): GuestSummary {
  const today = formatDateForPrague(new Date())
  const counted = stays.filter((stay) => isBlocking(stay.status))
  const dates = counted.map((stay) => stay.startDate).sort()

  return {
    ...guest,
    stayCount: counted.length,
    nightCount: counted.reduce((sum, stay) => sum + stay.nights, 0),
    totalCents: counted.reduce((sum, stay) => sum + (stay.priceCents ?? 0), 0),
    currency: counted.find((stay) => stay.priceCents !== null)?.currency ?? "CZK",
    firstStayDate: dates[0] ?? null,
    lastStayDate: dates[dates.length - 1] ?? null,
    isReturning: counted.length > 1,
    hasUpcomingStay: counted.some((stay) => stay.endDate >= today)
  }
}

function toStay(reservation: {
  id: number
  startDate: string
  endDate: string
  status: string
  source: string
  priceCents: number | null
  currency: string
  adults: number
  children: number
  hasDog: boolean
  dogsCount: number
  apartment: { name: string }
}): GuestStay {
  return {
    reservationId: reservation.id,
    apartmentName: reservation.apartment.name,
    startDate: reservation.startDate,
    endDate: reservation.endDate,
    nights: countNights(reservation.startDate, reservation.endDate),
    status: reservation.status as ReservationStatus,
    source: reservation.source as ReservationSource,
    priceCents: reservation.priceCents,
    currency: reservation.currency,
    adults: reservation.adults,
    children: reservation.children,
    hasDog: reservation.hasDog,
    dogsCount: reservation.dogsCount
  }
}

const STAY_SELECT = {
  id: true,
  startDate: true,
  endDate: true,
  status: true,
  source: true,
  priceCents: true,
  currency: true,
  adults: true,
  children: true,
  hasDog: true,
  dogsCount: true,
  apartment: { select: { name: true } }
} as const

export async function listGuestsWithStats(): Promise<GuestSummary[]> {
  const guests = await prisma.guest.findMany({
    orderBy: { name: "asc" },
    include: { reservations: { select: STAY_SELECT, orderBy: { startDate: "desc" } } }
  })

  return guests.map((guest) => {
    const { reservations, ...rest } = guest
    return summarize(rest, reservations.map(toStay))
  })
}

export interface GuestDetail extends GuestSummary {
  stays: GuestStay[]
}

export async function getGuestDetail(guestId: string): Promise<GuestDetail | null> {
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: { reservations: { select: STAY_SELECT, orderBy: { startDate: "desc" } } }
  })

  if (!guest) return null

  const { reservations, ...rest } = guest
  const stays = reservations.map(toStay)
  return { ...summarize(rest, stays), stays }
}

export async function updateGuestNote(guestId: string, note: string | null) {
  await prisma.guest.update({ where: { id: guestId }, data: { note: note?.trim() || null } })
}

/**
 * One-off backfill: builds address-book entries from reservations that predate
 * the Guest table. Idempotent — reservations already linked are skipped, and
 * findOrCreateGuest merges rather than duplicates.
 */
export async function backfillGuestsFromReservations(): Promise<{ linked: number; skipped: number }> {
  const reservations = await prisma.reservation.findMany({
    where: { guestId: null },
    select: { id: true, name: true, email: true, phone: true },
    orderBy: { id: "asc" }
  })

  let linked = 0
  let skipped = 0

  for (const reservation of reservations) {
    const guestId = await findOrCreateGuest(reservation)
    if (!guestId) {
      skipped += 1
      continue
    }
    await prisma.reservation.update({ where: { id: reservation.id }, data: { guestId } })
    linked += 1
  }

  return { linked, skipped }
}
