// Pure, dependency-free logic shared by both server code (lib/reservations.ts's
// getDashboardStats) and client components (components/admin-sync.tsx). Kept
// out of lib/reservations.ts itself because that module pulls in Prisma and
// node-ical (which needs Node's `fs`) — importing anything from it into a
// client component bundles all of that into the browser build.
export type FeedStatus = "ok" | "error" | "pending" | "unconfigured"

export interface FeedStatusInput {
  lastSyncedAt: string | null
  lastSyncError: string | null
}

export function getFeedStatus(feed: FeedStatusInput | undefined): FeedStatus {
  if (!feed) return "unconfigured"
  if (feed.lastSyncError) return "error"
  if (!feed.lastSyncedAt) return "pending"
  return "ok"
}
