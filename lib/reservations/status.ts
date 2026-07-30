import type { ReservationStatus } from "./types"

// Pure, dependency-free so client components can import it without pulling
// Prisma or node-ical into the browser bundle (same reasoning as
// lib/feed-status.ts).
//
// Nothing anywhere should compare a status to a string literal. Before this
// module existed, `status === "active"` was hard-coded in eleven places
// across the public site, the admin UI and the guest-email scheduler, which
// made adding a third status a hunt rather than an edit.

// An inquiry is non-binding but still holds the dates. Letting it not block
// would allow a second guest to book the same nights while the first is
// being negotiated: a real double booking, invisible until someone arrives.
// A forgotten inquiry is the cheaper failure — it is visible in the list and
// one click to cancel.
export const BLOCKING_STATUSES = ["confirmed", "inquiry"] as const satisfies readonly ReservationStatus[]

export function isBlocking(status: ReservationStatus) {
  return (BLOCKING_STATUSES as readonly ReservationStatus[]).includes(status)
}

// Guest lifecycle emails (confirmation, arrival info, departure reminder,
// thank you) must reach confirmed bookings only. An inquiry holds the dates
// but nothing is agreed yet — telling that guest "your stay is confirmed,
// here is how to get in" would be wrong. Deliberately narrower than
// BLOCKING_STATUSES.
export const EMAILABLE_STATUSES = ["confirmed"] as const satisfies readonly ReservationStatus[]

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  inquiry: "Poptávka",
  confirmed: "Potvrzeno",
  cancelled: "Zrušeno",
  no_show: "Nedorazil"
}

export function describeReservationStatus(status: ReservationStatus) {
  return RESERVATION_STATUS_LABELS[status] ?? status
}
