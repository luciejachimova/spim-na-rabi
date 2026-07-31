import { prisma } from "../db"
import { addDaysToKey, formatDateForPrague } from "../prague-date"
import { BLOCKING_STATUSES_FOR_READ } from "./status"
import type { ReservationSource, ReservationStatus } from "./types"

// Data for the front door of the manager: what is happening today, what is
// coming tomorrow, and anything that needs attention before it becomes a
// problem at the door. Everything here comes from tables that already exist.

export interface TodayStay {
  id: number
  apartmentId: number
  apartmentName: string
  apartmentShortLabel: string | null
  apartmentColor: string
  checkInFrom: string
  checkOutUntil: string
  startDate: string
  endDate: string
  status: ReservationStatus
  source: ReservationSource
  name: string | null
  phone: string | null
  adults: number
  children: number
  hasDog: boolean
  dogsCount: number
  priceCents: number | null
  currency: string
  isPaid: boolean
  arrivalTime: string | null
  departureTime: string | null
  note: string | null
  guestNote: string | null
}

export type ProblemKind = "sync_failed" | "unpaid_arrival" | "missing_contact"

export interface TodayProblem {
  kind: ProblemKind
  text: string
  href: string | null
}

export interface TodayOverview {
  today: string
  tomorrow: string
  arrivalsToday: TodayStay[]
  departuresToday: TodayStay[]
  stayingNow: TodayStay[]
  arrivalsTomorrow: TodayStay[]
  departuresTomorrow: TodayStay[]
  problems: TodayProblem[]
  freeApartments: { id: number; name: string; shortLabel: string | null }[]
}

const STAY_SELECT = {
  id: true,
  apartmentId: true,
  startDate: true,
  endDate: true,
  status: true,
  source: true,
  name: true,
  phone: true,
  email: true,
  adults: true,
  children: true,
  hasDog: true,
  dogsCount: true,
  priceCents: true,
  currency: true,
  isPaid: true,
  arrivalTime: true,
  departureTime: true,
  note: true,
  guestNote: true,
  apartment: {
    select: { id: true, name: true, shortLabel: true, color: true, checkInFrom: true, checkOutUntil: true }
  }
} as const

type StayRow = {
  id: number
  apartmentId: number
  startDate: string
  endDate: string
  status: string
  source: string
  name: string | null
  phone: string | null
  email: string | null
  adults: number
  children: number
  hasDog: boolean
  dogsCount: number
  priceCents: number | null
  currency: string
  isPaid: boolean
  arrivalTime: string | null
  departureTime: string | null
  note: string | null
  guestNote: string | null
  apartment: { id: number; name: string; shortLabel: string | null; color: string; checkInFrom: string; checkOutUntil: string }
}

function toStay(row: StayRow): TodayStay {
  return {
    id: row.id,
    apartmentId: row.apartmentId,
    apartmentName: row.apartment.name,
    apartmentShortLabel: row.apartment.shortLabel,
    apartmentColor: row.apartment.color,
    checkInFrom: row.apartment.checkInFrom,
    checkOutUntil: row.apartment.checkOutUntil,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status as ReservationStatus,
    source: row.source as ReservationSource,
    name: row.name,
    phone: row.phone,
    adults: row.adults,
    children: row.children,
    hasDog: row.hasDog,
    dogsCount: row.dogsCount,
    priceCents: row.priceCents,
    currency: row.currency,
    isPaid: row.isPaid,
    arrivalTime: row.arrivalTime,
    departureTime: row.departureTime,
    note: row.note,
    guestNote: row.guestNote
  }
}

// How far ahead to look for reservations that still need a contact filled in.
// Two weeks is roughly how far in advance it stops being comfortable to be
// missing a phone number for someone who is coming.
const CONTACT_LOOKAHEAD_DAYS = 14

// A feed that hasn't synced for this long has quietly stopped, even if it
// never reported an error. The external cron runs every 15 minutes.
const SYNC_STALE_HOURS = 3

export async function getTodayOverview(): Promise<TodayOverview> {
  const today = formatDateForPrague(new Date())
  const tomorrow = addDaysToKey(today, 1)
  const lookahead = addDaysToKey(today, CONTACT_LOOKAHEAD_DAYS)

  const [rows, apartments, feeds] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        status: { in: BLOCKING_STATUSES_FOR_READ },
        // Everything touching today or tomorrow, plus the look-ahead window
        // used for the "missing contact" nudge — one query, not four.
        startDate: { lte: lookahead },
        endDate: { gte: today }
      },
      select: STAY_SELECT,
      orderBy: [{ startDate: "asc" }, { id: "asc" }]
    }),
    prisma.apartment.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, shortLabel: true }
    }),
    prisma.icalFeed.findMany({ select: { provider: true, lastSyncError: true, lastSyncedAt: true } })
  ])

  const stays = (rows as StayRow[]).map(toStay)

  const arrivalsToday = stays.filter((stay) => stay.startDate === today)
  const departuresToday = stays.filter((stay) => stay.endDate === today)
  // Half-open interval: someone whose stay ends today is leaving, not staying.
  const stayingNow = stays.filter((stay) => stay.startDate < today && stay.endDate > today)
  const arrivalsTomorrow = stays.filter((stay) => stay.startDate === tomorrow)
  const departuresTomorrow = stays.filter((stay) => stay.endDate === tomorrow)

  const occupiedNow = new Set([...stayingNow, ...arrivalsToday].map((stay) => stay.apartmentId))
  const freeApartments = apartments.filter((apartment) => !occupiedNow.has(apartment.id))

  const problems: TodayProblem[] = []

  for (const feed of feeds) {
    const label = feed.provider === "booking" ? "Booking.com" : "Airbnb"
    if (feed.lastSyncError) {
      problems.push({ kind: "sync_failed", text: `Synchronizace ${label} hlásí chybu.`, href: "/admin/sync" })
    } else if (feed.lastSyncedAt && Date.now() - feed.lastSyncedAt.getTime() > SYNC_STALE_HOURS * 3_600_000) {
      problems.push({ kind: "sync_failed", text: `${label} se nesynchronizoval přes ${SYNC_STALE_HOURS} hodiny.`, href: "/admin/sync" })
    }
  }

  // Money is easiest to collect while the guest is standing in the doorway;
  // after they leave it becomes a phone call.
  for (const stay of [...arrivalsToday, ...arrivalsTomorrow]) {
    if (stay.priceCents !== null && !stay.isPaid) {
      const when = stay.startDate === today ? "dnes" : "zítra"
      problems.push({
        kind: "unpaid_arrival",
        text: `${stay.name || "Host"} přijíždí ${when} a nemá zaplaceno.`,
        href: `/manager/rezervace/${stay.id}`
      })
    }
  }

  // Booking and Airbnb send no contact details at all, so an upcoming stay can
  // sit there with nobody to call if the guest is late.
  for (const stay of stays) {
    if (stay.startDate < today || stay.startDate > lookahead) continue
    if (stay.source !== "booking" && stay.source !== "airbnb") continue
    if (stay.phone) continue
    problems.push({
      kind: "missing_contact",
      text: `Rezervace ${stay.startDate === today ? "dnes" : `od ${stay.startDate}`} nemá telefon na hosta.`,
      href: `/manager/rezervace/${stay.id}`
    })
  }

  return {
    today,
    tomorrow,
    arrivalsToday,
    departuresToday,
    stayingNow,
    arrivalsTomorrow,
    departuresTomorrow,
    problems,
    freeApartments
  }
}
