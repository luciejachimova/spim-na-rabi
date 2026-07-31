import type { ReservationSource, ReservationStatus } from "./types"

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

// ─── Transition value, remove after the production migration ───────────────
//
// M1 renames status 'active' to 'confirmed'. Code and data cannot change in
// the same instant, so whichever goes first there is a window where they
// disagree — and the failure is silent and expensive: a reservations table
// full of 'active' rows read by code that only knows 'confirmed' reports
// every night as free, and /api/availability offers an occupied apartment to
// a guest on the public site.
//
// Reads therefore accept the old value as well. Writes never produce it
// (create hardcodes 'confirmed'), so this only has to survive until the
// migration has run and been verified. Deleting it afterwards is a
// three-line change tracked in docs/RELEASE.md.
const LEGACY_ACTIVE = "active"

// Cast because Prisma's generated enum no longer contains the legacy value.
// SQLite stores an enum as plain TEXT with no CHECK constraint, so the query
// matches it correctly at runtime; the cast is what makes the compiler accept
// a value that is real in the database but gone from the schema. It goes away
// with LEGACY_ACTIVE.
export const BLOCKING_STATUSES_FOR_READ = [...BLOCKING_STATUSES, LEGACY_ACTIVE] as unknown as ReservationStatus[]

// Takes a string rather than ReservationStatus on purpose: during the
// transition the database really can hold a value the union does not model.
export function isBlocking(status: ReservationStatus | string) {
  return (BLOCKING_STATUSES_FOR_READ as readonly string[]).includes(status)
}

// Guest lifecycle emails (confirmation, arrival info, departure reminder,
// thank you) must reach confirmed bookings only. An inquiry holds the dates
// but nothing is agreed yet — telling that guest "your stay is confirmed,
// here is how to get in" would be wrong. Deliberately narrower than
// BLOCKING_STATUSES.
export const EMAILABLE_STATUSES = ["confirmed"] as const satisfies readonly ReservationStatus[]

// Same transition tolerance as above: a guest whose booking still says
// 'active' must not silently stop receiving their arrival instructions.
export const EMAILABLE_STATUSES_FOR_READ = [...EMAILABLE_STATUSES, LEGACY_ACTIVE] as unknown as ReservationStatus[]

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  inquiry: "Poptávka",
  confirmed: "Potvrzeno",
  cancelled: "Zrušeno",
  no_show: "Nedorazil",
  // Only ever seen on a pre-migration row; reads the same as confirmed to
  // whoever is looking at it.
  active: "Potvrzeno"
}

// What the owner can pick in a form or filter by. Deliberately not
// Object.keys(RESERVATION_STATUS_LABELS): the legacy value must never be
// offered as a choice, only understood when it is read.
export const SELECTABLE_STATUSES = ["inquiry", "confirmed", "cancelled", "no_show"] as const satisfies readonly ReservationStatus[]

export function describeReservationStatus(status: ReservationStatus) {
  return RESERVATION_STATUS_LABELS[status] ?? status
}

// Lives here rather than in a component so both the admin UI and the manager
// read the same list, and so adding a source to the enum fails the build in one
// place instead of silently rendering a raw value like "admin_block".
export const SOURCE_LABELS: Record<ReservationSource, string> = {
  website: "Web",
  booking: "Booking.com",
  airbnb: "Airbnb",
  phone: "Telefon",
  email: "E-mail",
  admin_block: "Blokováno majitelem"
}

export function describeReservationSource(source: ReservationSource) {
  return SOURCE_LABELS[source] ?? source
}
