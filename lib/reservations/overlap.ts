import { toUtcDate } from "../prague-date"
import type { ReservationSource, ReservationStatus } from "./types"

// Pure date maths, no Prisma — so the reservation form (a client component)
// can import it without pulling the database client into the browser bundle.
// Same split as lib/feed-status.ts and lib/reservations/status.ts.

// A reservation reduced to what the form needs in order to tell the owner
// "these nights are taken" the moment they pick a date.
//
// The check runs on the client from this list rather than round-tripping on
// every keystroke: two apartments and a season of bookings is a few kilobytes,
// and computing the overlap locally is instant even on a phone with a weak
// signal at Rabí. The authoritative check remains the single atomic SQL
// statement at write time — this is feedback, not correctness.
export interface BlockedRange {
  id: number
  apartmentId: number
  startDate: string
  endDate: string
  status: ReservationStatus
  source: ReservationSource
  label: string
}

// Half-open intervals: a departure on the 10th and an arrival on the 10th do
// not overlap. That is the whole point of storing endDate as exclusive, and it
// is the case the cleaning module cares about most.
export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && aEnd > bStart
}

export function findConflicts(
  ranges: BlockedRange[],
  input: { apartmentId: number; startDate: string; endDate: string; excludeReservationId?: number }
) {
  if (!input.startDate || !input.endDate || input.startDate >= input.endDate) {
    return []
  }

  return ranges.filter(
    (range) =>
      range.apartmentId === input.apartmentId &&
      range.id !== input.excludeReservationId &&
      rangesOverlap(input.startDate, input.endDate, range.startDate, range.endDate)
  )
}

export function countNights(startDate: string, endDate: string) {
  if (!startDate || !endDate || startDate >= endDate) return 0
  // toUtcDate handles the month-index offset; doing the arithmetic inline with
  // Date.UTC(y, m, d) would silently misorder dates across month ends, because
  // the un-decremented month rolls 2026-01-31 past 2026-02-02.
  return Math.round((toUtcDate(endDate).getTime() - toUtcDate(startDate).getTime()) / 86_400_000)
}
