import { formatDateForPrague } from "../prague-date"
import { ReservationValidationError } from "../reservations/errors"
import { areDatesValid } from "../reservations/validation"

export interface IcalEntry {
  type?: string
  uid?: string
  start?: Date | string
  end?: Date | string
  summary?: string
  description?: string
  status?: string
}

export interface NormalizedIcalEvent {
  externalUid: string
  startDate: string
  endDate: string
  name: string | null
  note: string | null
}

export function isIcalEntry(value: unknown): value is IcalEntry {
  if (!value || typeof value !== "object") {
    return false
  }

  const entry = value as Record<string, unknown>
  return typeof entry.type === "string"
}

export function isCancelledEntry(entry: IcalEntry) {
  return String(entry.status || "").toUpperCase() === "CANCELLED"
}

export function normalizeExternalUid(entry: IcalEntry) {
  if (entry.uid && entry.uid.trim()) {
    return entry.uid.trim()
  }

  const summary = entry.summary?.trim() || "booking"
  const start = entry.start instanceof Date ? formatDateForPrague(entry.start) : String(entry.start || "")
  const end = entry.end instanceof Date ? formatDateForPrague(entry.end) : String(entry.end || "")
  return `${summary}:${start}:${end}`
}

export function toDateString(value: Date | string | undefined) {
  if (!value) {
    throw new ReservationValidationError("Termín rezervace je neúplný.", "rangeIncomplete")
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new ReservationValidationError("Termín rezervace je neplatný.", "rangeInvalid")
  }

  return formatDateForPrague(date)
}

export function normalizeBookingEvent(entry: IcalEntry): NormalizedIcalEvent | null {
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
