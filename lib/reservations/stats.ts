import type { IcalFeed as PrismaIcalFeed } from "@prisma/client"
import { prisma } from "../db"
import { getFeedStatus } from "../feed-status"
import { buildApartmentIcal } from "../ical/export"
import { addDaysToKey, formatDateForPrague, toUtcDate } from "../prague-date"
import { mapIcalFeed } from "./mappers"
import { listAllReservations, listApartments } from "./queries"
import type { ApartmentRecord, IcalProvider, ReservationWithApartment } from "./types"

function pad2(value: number) {
  return String(value).padStart(2, "0")
}

// Nights of a given calendar month booked across all apartments, as a
// percentage of total possible apartment-nights that month.
async function computeOccupancyForMonth(
  year: number,
  monthIndexZeroBased: number,
  apartmentCount: number
): Promise<number> {
  if (apartmentCount === 0) {
    return 0
  }

  const monthStart = `${year}-${pad2(monthIndexZeroBased + 1)}-01`
  const daysInMonth = new Date(year, monthIndexZeroBased + 1, 0).getDate()
  const firstOfNextMonth = new Date(year, monthIndexZeroBased + 1, 1)
  const monthEndExclusive = `${firstOfNextMonth.getFullYear()}-${pad2(firstOfNextMonth.getMonth() + 1)}-01`

  const reservations = await prisma.reservation.findMany({
    where: {
      status: "active",
      startDate: { lt: monthEndExclusive },
      endDate: { gt: monthStart }
    },
    select: { startDate: true, endDate: true }
  })

  let bookedNights = 0
  for (const reservation of reservations) {
    const overlapStart = reservation.startDate > monthStart ? reservation.startDate : monthStart
    const overlapEnd = reservation.endDate < monthEndExclusive ? reservation.endDate : monthEndExclusive
    const nights = Math.round((toUtcDate(overlapEnd).getTime() - toUtcDate(overlapStart).getTime()) / 86_400_000)
    bookedNights += Math.max(0, nights)
  }

  const totalPossibleNights = apartmentCount * daysInMonth
  return totalPossibleNights === 0 ? 0 : Math.round((bookedNights / totalPossibleNights) * 100)
}

export interface DashboardStats {
  totalReservations: number
  futureStays: number
  checkInsToday: number
  checkOutsToday: number
  occupancyThisMonth: number
  occupancyNextMonth: number
  lastSyncedAt: string | null
  lastSyncError: string | null
  systemStatus: "ok" | "warning" | "error"
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const todayKey = formatDateForPrague(new Date())
  const apartments = await listApartments()

  const [totalReservations, futureStays, checkInsToday, checkOutsToday, feeds] = await Promise.all([
    prisma.reservation.count(),
    prisma.reservation.count({ where: { status: "active", startDate: { gte: todayKey } } }),
    prisma.reservation.count({ where: { status: "active", startDate: todayKey } }),
    prisma.reservation.count({ where: { status: "active", endDate: todayKey } }),
    prisma.icalFeed.findMany()
  ])

  const now = new Date()
  const [occupancyThisMonth, occupancyNextMonth] = await Promise.all([
    computeOccupancyForMonth(now.getFullYear(), now.getMonth(), apartments.length),
    computeOccupancyForMonth(now.getFullYear(), now.getMonth() + 1, apartments.length)
  ])

  const syncedTimestamps = feeds
    .map((feed) => feed.lastSyncedAt)
    .filter((value): value is Date => value !== null)
    .sort((a, b) => b.getTime() - a.getTime())
  const lastSyncedAt = syncedTimestamps[0] ? syncedTimestamps[0].toISOString() : null

  const failedFeeds = feeds
    .filter((feed) => feed.lastSyncError)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  const lastSyncError = failedFeeds[0]?.lastSyncError ?? null

  const feedStatuses = feeds.map((feed) => getFeedStatus(mapIcalFeed(feed)))
  const systemStatus: DashboardStats["systemStatus"] = feedStatuses.some((status) => status === "error")
    ? "error"
    : feedStatuses.some((status) => status === "pending")
      ? "warning"
      : "ok"

  return {
    totalReservations,
    futureStays,
    checkInsToday,
    checkOutsToday,
    occupancyThisMonth,
    occupancyNextMonth,
    lastSyncedAt,
    lastSyncError,
    systemStatus
  }
}

export type HealthStatus = "ok" | "warning" | "error"

export interface ProviderHealth {
  status: HealthStatus
  detail: string | null
}

export interface SyncSystemStatus {
  cron: {
    status: HealthStatus
    lastRun: string | null
    lastSuccess: string | null
    lastError: string | null
  }
  booking: ProviderHealth
  airbnb: ProviderHealth
  icalExport: ProviderHealth
  turso: ProviderHealth
  smtp: ProviderHealth
}

function statusForProvider(feeds: PrismaIcalFeed[], provider: IcalProvider): ProviderHealth {
  const providerFeeds = feeds.filter((feed) => feed.provider === provider)

  if (providerFeeds.length === 0) {
    return { status: "warning", detail: "Není nastaven žádný feed." }
  }

  const withError = providerFeeds.find((feed) => feed.lastSyncError)
  if (withError) {
    return { status: "error", detail: withError.lastSyncError }
  }

  const neverSynced = providerFeeds.find((feed) => !feed.lastSyncedAt)
  if (neverSynced) {
    return { status: "warning", detail: "Čeká na první synchronizaci." }
  }

  return { status: "ok", detail: null }
}

// Detailed health panel for the Kalendáře page. Reuses existing IcalFeed
// fields rather than adding new columns: `updatedAt` doubles as "last
// attempt" since both the success and failure paths in importIcalFeed call
// prisma.icalFeed.update(), and `lastSyncedAt` already only advances on
// success — so "last run" vs "last successful run" falls out for free.
export async function getSyncSystemStatus(): Promise<SyncSystemStatus> {
  let turso: ProviderHealth = { status: "ok", detail: null }
  let feeds: PrismaIcalFeed[] = []
  let apartments: ApartmentRecord[] = []

  try {
    ;[feeds, apartments] = await Promise.all([prisma.icalFeed.findMany(), listApartments()])
  } catch (error) {
    turso = { status: "error", detail: error instanceof Error ? error.message : "Databáze není dostupná." }
  }

  const booking = statusForProvider(feeds, "booking")
  const airbnb = statusForProvider(feeds, "airbnb")

  let icalExport: ProviderHealth = { status: "warning", detail: "Není nastaven žádný apartmán." }
  if (apartments.length > 0) {
    try {
      await buildApartmentIcal(apartments[0])
      icalExport = { status: "ok", detail: null }
    } catch (error) {
      icalExport = { status: "error", detail: error instanceof Error ? error.message : "Export selhal." }
    }
  }

  const smtpConfigured = Boolean(
    (process.env.SMTP_PASS || process.env.SMTP_PASSWORD) && (process.env.SMTP_HOST || process.env.SMTP_ADDRESS)
  )
  const smtp: ProviderHealth = smtpConfigured
    ? { status: "ok", detail: null }
    : { status: "warning", detail: "SMTP není nakonfigurováno." }

  const lastRun = feeds.map((feed) => feed.updatedAt).sort((a, b) => b.getTime() - a.getTime())[0]
  const lastSuccess = feeds
    .map((feed) => feed.lastSyncedAt)
    .filter((value): value is Date => value !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0]
  const lastErrorFeed = feeds
    .filter((feed) => feed.lastSyncError)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]

  const cronStatus: HealthStatus =
    booking.status === "error" || airbnb.status === "error"
      ? "error"
      : booking.status === "warning" || airbnb.status === "warning"
        ? "warning"
        : "ok"

  return {
    cron: {
      status: cronStatus,
      lastRun: lastRun ? lastRun.toISOString() : null,
      lastSuccess: lastSuccess ? lastSuccess.toISOString() : null,
      lastError: lastErrorFeed?.lastSyncError ?? null
    },
    booking,
    airbnb,
    icalExport,
    turso,
    smtp
  }
}

export interface HousekeepingSchedule {
  today: string
  tomorrow: string
  todayCheckIns: ReservationWithApartment[]
  todayCheckOuts: ReservationWithApartment[]
  tomorrowCheckIns: ReservationWithApartment[]
  tomorrowCheckOuts: ReservationWithApartment[]
}

export async function getHousekeepingSchedule(): Promise<HousekeepingSchedule> {
  const today = formatDateForPrague(new Date())
  const tomorrow = addDaysToKey(today, 1)

  const reservations = (await listAllReservations()).filter((reservation) => reservation.status === "active")

  return {
    today,
    tomorrow,
    todayCheckIns: reservations.filter((reservation) => reservation.startDate === today),
    todayCheckOuts: reservations.filter((reservation) => reservation.endDate === today),
    tomorrowCheckIns: reservations.filter((reservation) => reservation.startDate === tomorrow),
    tomorrowCheckOuts: reservations.filter((reservation) => reservation.endDate === tomorrow)
  }
}
