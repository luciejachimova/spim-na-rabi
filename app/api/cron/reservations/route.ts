import { NextResponse } from "next/server"
import { syncAllApartments } from "@/lib/reservations"

export const runtime = "nodejs"

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // Fail closed: an unconfigured secret must not mean "open to the public".
    return false
  }

  const url = new URL(request.url)
  const header = request.headers.get("authorization") || request.headers.get("x-cron-secret")
  const queryParam = url.searchParams.get("secret")

  return header === `Bearer ${secret}` || header === secret || queryParam === secret
}

async function handleSync(request: Request) {
  if (!process.env.CRON_SECRET) {
    console.error("CRON_SECRET is not configured — refusing to run reservation sync.")
    return NextResponse.json({ error: "Synchronizace není nakonfigurována." }, { status: 500 })
  }

  if (!isAuthorized(request)) {
    console.warn("Rejected unauthorized reservation sync request", {
      hasAuthHeader: request.headers.has("authorization"),
      hasCronSecretHeader: request.headers.has("x-cron-secret")
    })
    return NextResponse.json({ error: "Neoprávněný přístup." }, { status: 401 })
  }

  const startedAt = Date.now()
  console.log("Reservation sync started")

  const result = await syncAllApartments()

  const durationMs = Date.now() - startedAt
  const failed = result.feeds.filter((feed) => feed.error)

  for (const feed of result.feeds) {
    if (feed.error) {
      console.error("Reservation sync: feed failed", {
        apartmentSlug: feed.apartmentSlug,
        provider: feed.provider,
        error: feed.error
      })
    } else {
      console.log("Reservation sync: feed OK", {
        apartmentSlug: feed.apartmentSlug,
        provider: feed.provider,
        fetchedEvents: feed.fetchedEvents,
        created: feed.created,
        updated: feed.updated,
        deleted: feed.deleted
      })
    }
  }

  console.log("Reservation sync finished", {
    durationMs,
    feedsTotal: result.feeds.length,
    feedsFailed: failed.length
  })

  return NextResponse.json({ ...result, durationMs })
}

// Both methods run the same sync — external cron services can use whichever is easier to configure.
export async function GET(request: Request) {
  return handleSync(request)
}

export async function POST(request: Request) {
  return handleSync(request)
}
