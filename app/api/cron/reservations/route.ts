import { NextResponse } from "next/server"
import { syncAllApartments } from "@/lib/reservations"
import { prisma } from "@/lib/db"

export const runtime = "nodejs"

function describeError(error: unknown) {
  return {
    name: error instanceof Error ? error.name : typeof error,
    message: error instanceof Error ? error.message : String(error)
  }
}

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
  console.log("Reservation sync: request received", { method: request.method })

  if (!process.env.CRON_SECRET) {
    console.error("Reservation sync: CRON_SECRET is not configured — refusing to run.")
    return NextResponse.json({ error: "Synchronizace není nakonfigurována." }, { status: 500 })
  }

  if (!isAuthorized(request)) {
    console.warn("Reservation sync: unauthorized request rejected", {
      hasAuthHeader: request.headers.has("authorization"),
      hasCronSecretHeader: request.headers.has("x-cron-secret")
    })
    return NextResponse.json({ error: "Neoprávněný přístup." }, { status: 401 })
  }

  console.log("Reservation sync: authorized — checking database connection")

  let feedCount: number
  try {
    feedCount = await prisma.icalFeed.count()
  } catch (error) {
    const details = describeError(error)
    console.error("Reservation sync: database connection failed", details)
    return NextResponse.json(
      {
        error: "Synchronizaci se nepodařilo spustit — chyba připojení k databázi.",
        stage: "database",
        ...details
      },
      { status: 500 }
    )
  }

  console.log("Reservation sync: database reachable", { feedCount })

  if (feedCount === 0) {
    console.log("Reservation sync: no Booking/Airbnb feeds configured — nothing to sync")
    return NextResponse.json({
      feeds: [],
      durationMs: 0,
      message: "Není nastavený žádný Booking.com ani Airbnb kalendář — nastavte ho v adminu."
    })
  }

  console.log("Reservation sync: starting", { feedCount })
  const startedAt = Date.now()

  let result: Awaited<ReturnType<typeof syncAllApartments>>
  try {
    result = await syncAllApartments()
  } catch (error) {
    const details = describeError(error)
    console.error("Reservation sync: unexpected failure initializing sync", details)
    return NextResponse.json(
      {
        error: "Synchronizace selhala.",
        stage: "sync",
        ...details
      },
      { status: 500 }
    )
  }

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

  console.log("Reservation sync: finished", {
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
