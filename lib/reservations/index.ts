// Barrel for the reservations domain.
//
// This module used to be a single 1150-line lib/reservations.ts. It was split
// into focused modules, but the barrel keeps the public API byte-for-byte
// identical so that all 21 existing importers of "@/lib/reservations" — the
// public site, the admin UI, the API routes and the cron endpoint — keep
// working unchanged. New code should prefer importing from the specific
// module (e.g. "@/lib/reservations/queries") instead of this barrel.

export * from "./types"
export * from "./errors"
export * from "./status"
export * from "./overlap"
export * from "./validation"
export * from "./availability"
export * from "./guests"
export * from "./mappers"
export * from "./queries"
export * from "./create"
export * from "./update"
export * from "./cancel"
export * from "./sync"
export * from "./stats"
export { getBaseUrl, getApartmentIcalFilename, getPublicIcalUrl } from "./urls"
export { buildApartmentIcal } from "../ical/export"
export { importIcalFeed } from "../ical/import"

// Re-exported (not defined here) so client components can import this pure
// logic from lib/feed-status.ts directly without pulling in this module's
// server-only dependencies (Prisma, node-ical) into their bundle.
export { getFeedStatus } from "../feed-status"
export type { FeedStatus } from "../feed-status"
