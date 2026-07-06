import ical from "ical-generator"
import icalParser from "node-ical"
import type { Apartment as PrismaApartment, IcalFeed as PrismaIcalFeed, Reservation as PrismaReservation } from "@prisma/client"
import { prisma } from "./db"
import { getFeedStatus, type FeedStatus } from "./feed-status"

export type ReservationSource = "website" | "booking" | "airbnb" | "admin_block"
export type ReservationStatus = "active" | "cancelled"
export type IcalProvider = "booking" | "airbnb"

export interface ApartmentRecord {
  id: number
  slug: string
  name: string
  publicIcalUrl: string | null
}

export interface IcalFeedRecord {
  id: number
  apartmentId: number
  provider: IcalProvider
  url: string
  lastSyncedAt: string | null
  lastSyncError: string | null
}

export interface ApartmentWithFeeds extends ApartmentRecord {
  icalFeeds: IcalFeedRecord[]
}

export interface ReservationRecord {
  id: number
  apartmentId: number
  startDate: string
  endDate: string
  source: ReservationSource
  status: ReservationStatus
  externalUid: string | null
  name: string | null
  email: string | null
  phone: string | null
  guests: number | null
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface ReservationWithApartment extends ReservationRecord {
  apartmentSlug: string
  apartmentName: string
}

export interface WebsiteReservationInput {
  name: string
  email: string
  phone?: string
  apartmentSelection: string
  startDate: string
  endDate: string
  guests: number
  note?: string
}

export interface AdminBlockInput {
  apartmentId: number
  startDate: string
  endDate: string
  note?: string
}

export interface IcalImportResult {
  apartmentId: number
  apartmentSlug: string
  apartmentName: string
  provider: IcalProvider
  fetchedEvents: number
  created: number
  updated: number
  deleted: number
  error: string | null
}

export interface SyncResult {
  feeds: IcalImportResult[]
}

interface IcalEntry {
  type?: string
  uid?: string
  start?: Date | string
  end?: Date | string
  summary?: string
  description?: string
  status?: string
}

interface RawReservationRow {
  id: number | bigint
  apartment_id: number | bigint
  start_date: string
  end_date: string
  source: ReservationSource
  status: ReservationStatus
  external_uid: string | null
  name: string | null
  email: string | null
  phone: string | null
  guests: number | bigint | null
  note: string | null
  created_at: Date | string
  updated_at: Date | string
}

class ReservationError extends Error {}

export class ReservationValidationError extends ReservationError {}

export class ReservationConflictError extends ReservationError {}

export class ReservationNotFoundError extends ReservationError {}

const PRAGUE_TIME_ZONE = "Europe/Prague"
const DEFAULT_BASE_URL = "http://localhost:3000"

function getBaseUrl() {
  return (process.env.PUBLIC_APP_URL || DEFAULT_BASE_URL).replace(/\/$/, "")
}

function parseDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ReservationValidationError("Datum musí mít formát YYYY-MM-DD.")
  }

  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new ReservationValidationError("Datum není platné.")
  }

  return value
}

function toUtcDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function formatDateForPrague(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: PRAGUE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date)
}

function isIcalEntry(value: unknown): value is IcalEntry {
  if (!value || typeof value !== "object") {
    return false
  }

  const entry = value as Record<string, unknown>
  return typeof entry.type === "string"
}

function isCancelledEntry(entry: IcalEntry) {
  return String(entry.status || "").toUpperCase() === "CANCELLED"
}

function normalizeExternalUid(entry: IcalEntry) {
  if (entry.uid && entry.uid.trim()) {
    return entry.uid.trim()
  }

  const summary = entry.summary?.trim() || "booking"
  const start = entry.start instanceof Date ? formatDateForPrague(entry.start) : String(entry.start || "")
  const end = entry.end instanceof Date ? formatDateForPrague(entry.end) : String(entry.end || "")
  return `${summary}:${start}:${end}`
}

function toDateString(value: Date | string | undefined) {
  if (!value) {
    throw new ReservationValidationError("Termín rezervace je neúplný.")
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new ReservationValidationError("Termín rezervace je neplatný.")
  }

  return formatDateForPrague(date)
}

function areDatesValid(startDate: string, endDate: string) {
  return startDate < endDate
}

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

function mapApartment(apartment: PrismaApartment): ApartmentRecord {
  const record: ApartmentRecord = {
    id: apartment.id,
    slug: apartment.slug,
    name: apartment.name,
    publicIcalUrl: apartment.publicIcalUrl
  }

  // Always resolve to a real URL (falls back to PUBLIC_APP_URL) rather than
  // exposing a possibly-null/stale stored column to callers like the admin UI.
  return { ...record, publicIcalUrl: getPublicIcalUrl(record) }
}

function mapIcalFeed(feed: PrismaIcalFeed): IcalFeedRecord {
  return {
    id: feed.id,
    apartmentId: feed.apartmentId,
    provider: feed.provider as IcalProvider,
    url: feed.url,
    lastSyncedAt: feed.lastSyncedAt ? feed.lastSyncedAt.toISOString() : null,
    lastSyncError: feed.lastSyncError
  }
}

// Re-exported (not defined here) so client components can import this pure
// logic from lib/feed-status.ts directly without pulling in this module's
// server-only dependencies (Prisma, node-ical) into their bundle.
export { getFeedStatus }
export type { FeedStatus }

function toReservationWithApartment(
  reservation: PrismaReservation,
  apartment: Pick<ApartmentRecord, "slug" | "name">
): ReservationWithApartment {
  return {
    id: reservation.id,
    apartmentId: reservation.apartmentId,
    startDate: reservation.startDate,
    endDate: reservation.endDate,
    source: reservation.source as ReservationSource,
    status: reservation.status as ReservationStatus,
    externalUid: reservation.externalUid,
    name: reservation.name,
    email: reservation.email,
    phone: reservation.phone,
    guests: reservation.guests,
    note: reservation.note,
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
    apartmentSlug: apartment.slug,
    apartmentName: apartment.name
  }
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value
}

function mapRawReservationRow(row: RawReservationRow, apartment: Pick<ApartmentRecord, "slug" | "name">): ReservationWithApartment {
  return {
    id: Number(row.id),
    apartmentId: Number(row.apartment_id),
    startDate: row.start_date,
    endDate: row.end_date,
    source: row.source,
    status: row.status,
    externalUid: row.external_uid,
    name: row.name,
    email: row.email,
    phone: row.phone,
    guests: row.guests === null ? null : Number(row.guests),
    note: row.note,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    apartmentSlug: apartment.slug,
    apartmentName: apartment.name
  }
}

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
      name, email, phone, guests, note, created_at, updated_at
    )
    SELECT
      ${payload.apartmentId}, ${payload.startDate}, ${payload.endDate}, ${payload.source}, 'active', ${payload.externalUid},
      ${payload.name}, ${payload.email}, ${payload.phone}, ${payload.guests}, ${payload.note}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
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

export async function listApartments(): Promise<ApartmentRecord[]> {
  const apartments = await prisma.apartment.findMany({ orderBy: [{ name: "asc" }, { id: "asc" }] })
  return apartments.map(mapApartment)
}

export async function listApartmentsWithFeeds(): Promise<ApartmentWithFeeds[]> {
  const apartments = await prisma.apartment.findMany({
    orderBy: [{ name: "asc" }, { id: "asc" }],
    include: { icalFeeds: true }
  })

  return apartments.map((apartment) => ({
    ...mapApartment(apartment),
    icalFeeds: apartment.icalFeeds.map(mapIcalFeed)
  }))
}

export async function getApartmentBySelection(selection: string): Promise<ApartmentRecord | null> {
  const trimmed = selection.trim()
  if (!trimmed) {
    return null
  }

  const numericId = /^\d+$/.test(trimmed) ? Number(trimmed) : null

  const apartment = await prisma.apartment.findFirst({
    where: numericId !== null ? { OR: [{ slug: trimmed }, { id: numericId }] } : { slug: trimmed }
  })

  return apartment ? mapApartment(apartment) : null
}

export async function getApartmentBySlug(slug: string): Promise<ApartmentRecord | null> {
  const apartment = await prisma.apartment.findUnique({ where: { slug } })
  return apartment ? mapApartment(apartment) : null
}

export async function getApartmentById(apartmentId: number): Promise<ApartmentRecord | null> {
  const apartment = await prisma.apartment.findUnique({ where: { id: apartmentId } })
  return apartment ? mapApartment(apartment) : null
}

export async function listReservationsForApartment(apartmentId: number): Promise<ReservationWithApartment[]> {
  const apartment = await getApartmentById(apartmentId)
  if (!apartment) {
    throw new ReservationNotFoundError("Apartmán nebyl nalezen.")
  }

  const reservations = await prisma.reservation.findMany({
    where: { apartmentId },
    orderBy: [{ startDate: "asc" }, { id: "asc" }]
  })

  return reservations.map((reservation) => toReservationWithApartment(reservation, apartment))
}

export async function listAllReservations(): Promise<ReservationWithApartment[]> {
  const reservations = await prisma.reservation.findMany({
    include: { apartment: true },
    orderBy: [{ startDate: "asc" }, { id: "asc" }]
  })

  return reservations.map((reservation) => toReservationWithApartment(reservation, reservation.apartment))
}

function validateEmailFormat(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ReservationValidationError("Zadejte platný email.")
  }
}

function validateGuestsCount(guests: number) {
  if (!Number.isInteger(guests) || guests <= 0) {
    throw new ReservationValidationError("Počet hostů musí být celé číslo větší než 0.")
  }
}

export async function createWebsiteReservation(input: WebsiteReservationInput) {
  const name = input.name.trim()
  const email = input.email.trim()
  const phone = input.phone?.trim() || null
  const note = input.note?.trim() || null
  const guests = Number(input.guests)

  if (!name) {
    throw new ReservationValidationError("Jméno je povinné.")
  }

  if (!email) {
    throw new ReservationValidationError("Email je povinný.")
  }

  validateEmailFormat(email)
  validateGuestsCount(guests)

  const startDate = parseDateOnly(input.startDate)
  const endDate = parseDateOnly(input.endDate)

  if (!areDatesValid(startDate, endDate)) {
    throw new ReservationValidationError("Odjezd musí být po příjezdu.")
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
        note
      },
      apartment
    )

    if (reservation) {
      return { reservation, apartment }
    }
  }

  throw new ReservationConflictError(
    isAnySelection ? "V daném termínu není volný žádný apartmán." : "Vybraný termín je už obsazený."
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
      note: input.note?.trim() || null
    },
    apartment
  )

  if (!reservation) {
    throw new ReservationConflictError("Vybraný termín je už obsazený.")
  }

  return reservation
}

export async function cancelReservation(reservationId: number): Promise<ReservationWithApartment> {
  const existing = await prisma.reservation.findUnique({ where: { id: reservationId } })
  if (!existing) {
    throw new ReservationNotFoundError("Rezervace nebyla nalezena.")
  }

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "cancelled" },
    include: { apartment: true }
  })

  return toReservationWithApartment(updated, updated.apartment)
}

export interface UpdateReservationInput {
  apartmentId: number
  startDate: string
  endDate: string
  name?: string | null
  email?: string | null
  phone?: string | null
  guests?: number | null
  note?: string | null
}

// Same atomic-statement pattern as insertReservationAtomic — folds the
// "no other active reservation overlaps" check and the write into one
// statement so an edit can't race a concurrent booking into a conflict.
export async function updateReservation(reservationId: number, input: UpdateReservationInput): Promise<ReservationWithApartment> {
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

export async function deleteReservationPermanently(reservationId: number): Promise<void> {
  const existing = await prisma.reservation.findUnique({ where: { id: reservationId } })
  if (!existing) {
    throw new ReservationNotFoundError("Rezervace nebyla nalezena.")
  }

  await prisma.reservation.delete({ where: { id: reservationId } })
}

function validateIcalFeedUrl(provider: IcalProvider, url: string) {
  if (!/^https?:\/\//i.test(url)) {
    throw new ReservationValidationError("URL musí začínat http:// nebo https://.")
  }

  if (provider === "booking" && !/booking/i.test(url)) {
    throw new ReservationValidationError("Booking.com URL musí obsahovat „booking“.")
  }

  if (provider === "airbnb" && !/airbnb/i.test(url)) {
    throw new ReservationValidationError("Airbnb URL musí obsahovat „airbnb“.")
  }
}

export async function upsertIcalFeed(input: { apartmentId: number; provider: IcalProvider; url: string }): Promise<IcalFeedRecord> {
  const url = input.url.trim()
  if (!url) {
    throw new ReservationValidationError("URL feedu je povinná.")
  }

  validateIcalFeedUrl(input.provider, url)

  const apartment = await getApartmentById(input.apartmentId)
  if (!apartment) {
    throw new ReservationValidationError("Apartmán nebyl nalezen.")
  }

  const feed = await prisma.icalFeed.upsert({
    where: { apartmentId_provider: { apartmentId: input.apartmentId, provider: input.provider } },
    update: { url },
    create: { apartmentId: input.apartmentId, provider: input.provider, url }
  })

  return mapIcalFeed(feed)
}

function normalizeBookingEvent(entry: IcalEntry) {
  const startDate = toDateString(entry.start)
  const endDate = toDateString(entry.end || entry.start)

  if (!areDatesValid(startDate, endDate)) {
    return null
  }

  return {
    externalUid: normalizeExternalUid(entry),
    startDate,
    endDate,
    name: entry.summary?.trim() || null,
    note: entry.description?.trim() || null
  }
}

type IcalFeedWithApartment = PrismaIcalFeed & { apartment: PrismaApartment }

export async function importIcalFeed(feed: IcalFeedWithApartment): Promise<IcalImportResult> {
  const provider = feed.provider as IcalProvider

  let response: Response
  try {
    response = await fetch(feed.url, {
      headers: { Accept: "text/calendar, text/plain;q=0.8, */*;q=0.5" }
    })
  } catch {
    const message = `iCal (${provider}) se nepodařilo stáhnout pro ${feed.apartment.name}.`
    await prisma.icalFeed.update({ where: { id: feed.id }, data: { lastSyncError: message } }).catch(() => {})
    throw new ReservationError(message)
  }

  if (!response.ok) {
    const message = `iCal (${provider}) se nepodařilo stáhnout pro ${feed.apartment.name}.`
    await prisma.icalFeed.update({ where: { id: feed.id }, data: { lastSyncError: message } }).catch(() => {})
    throw new ReservationError(message)
  }

  const text = await response.text()
  const parsed = icalParser.parseICS(text)
  const importedUids = new Set<string>()
  let created = 0
  let updated = 0

  for (const entry of Object.values(parsed)) {
    if (!isIcalEntry(entry) || entry.type !== "VEVENT") {
      continue
    }

    const normalized = normalizeBookingEvent(entry)
    if (!normalized) {
      continue
    }

    importedUids.add(normalized.externalUid)

    if (isCancelledEntry(entry)) {
      await prisma.reservation.deleteMany({
        where: { apartmentId: feed.apartmentId, source: provider, externalUid: normalized.externalUid }
      })
      continue
    }

    const data = {
      apartmentId: feed.apartmentId,
      startDate: normalized.startDate,
      endDate: normalized.endDate,
      source: provider,
      status: "active" as const,
      externalUid: normalized.externalUid,
      name: normalized.name || feed.apartment.name,
      email: null,
      phone: null,
      guests: null,
      note: normalized.note
    }

    const existing = await prisma.reservation.findUnique({
      where: {
        apartmentId_source_externalUid: {
          apartmentId: feed.apartmentId,
          source: provider,
          externalUid: normalized.externalUid
        }
      }
    })

    if (existing) {
      await prisma.reservation.update({ where: { id: existing.id }, data })
      updated += 1
    } else {
      await prisma.reservation.create({ data })
      created += 1
    }
  }

  const existingFeedReservations = await prisma.reservation.findMany({
    where: { apartmentId: feed.apartmentId, source: provider }
  })

  const staleReservations = existingFeedReservations.filter(
    (reservation) => !reservation.externalUid || !importedUids.has(reservation.externalUid)
  )

  if (staleReservations.length > 0) {
    await prisma.reservation.deleteMany({
      where: { id: { in: staleReservations.map((reservation) => reservation.id) } }
    })
  }

  await prisma.icalFeed.update({
    where: { id: feed.id },
    data: { lastSyncedAt: new Date(), lastSyncError: null }
  })

  return {
    apartmentId: feed.apartmentId,
    apartmentSlug: feed.apartment.slug,
    apartmentName: feed.apartment.name,
    provider,
    fetchedEvents: importedUids.size,
    created,
    updated,
    deleted: staleReservations.length,
    error: null
  }
}

// A single unreachable/broken feed shouldn't abort syncing the others —
// failures are recorded per feed (and surfaced via IcalFeed.lastSyncError).
// Shared by syncAllApartments (cron, all feeds) and syncApartment (admin
// "Synchronizovat nyní", one apartment's feeds only).
async function runFeedSync(feeds: IcalFeedWithApartment[]): Promise<IcalImportResult[]> {
  const results: IcalImportResult[] = []

  for (const feed of feeds) {
    try {
      results.push(await importIcalFeed(feed))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Neznámá chyba při synchronizaci."
      console.error("Failed to import ical feed", { feedId: feed.id, provider: feed.provider, error })
      results.push({
        apartmentId: feed.apartmentId,
        apartmentSlug: feed.apartment.slug,
        apartmentName: feed.apartment.name,
        provider: feed.provider as IcalProvider,
        fetchedEvents: 0,
        created: 0,
        updated: 0,
        deleted: 0,
        error: message
      })
    }
  }

  return results
}

export async function syncAllApartments(): Promise<SyncResult> {
  const feeds = await prisma.icalFeed.findMany({ include: { apartment: true } })
  return { feeds: await runFeedSync(feeds) }
}

export async function syncApartment(apartmentId: number): Promise<SyncResult> {
  const apartment = await getApartmentById(apartmentId)
  if (!apartment) {
    throw new ReservationValidationError("Apartmán nebyl nalezen.")
  }

  const feeds = await prisma.icalFeed.findMany({ where: { apartmentId }, include: { apartment: true } })
  return { feeds: await runFeedSync(feeds) }
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

export function getApartmentIcalFilename(apartment: ApartmentRecord) {
  return `${apartment.slug}.ics`
}

export function getPublicIcalUrl(apartment: ApartmentRecord) {
  return apartment.publicIcalUrl || `${getBaseUrl()}/api/ical/${apartment.slug}`
}

function pad2(value: number) {
  return String(value).padStart(2, "0")
}

// Nights of a given calendar month booked across all apartments, as a
// percentage of total possible apartment-nights that month.
async function computeOccupancyForMonth(year: number, monthIndexZeroBased: number, apartmentCount: number): Promise<number> {
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

  const lastRun = feeds
    .map((feed) => feed.updatedAt)
    .sort((a, b) => b.getTime() - a.getTime())[0]
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
