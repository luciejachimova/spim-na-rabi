import { NextResponse } from "next/server"
import { syncApartment, ReservationValidationError } from "@/lib/reservations"

export const runtime = "nodejs"

interface SyncRequestBody {
  apartmentId?: unknown
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SyncRequestBody | null
  const apartmentId = Number(body?.apartmentId)

  if (!Number.isInteger(apartmentId)) {
    return NextResponse.json({ error: "Vyberte apartmán k synchronizaci." }, { status: 422 })
  }

  try {
    const startedAt = Date.now()
    const result = await syncApartment(apartmentId)
    const durationMs = Date.now() - startedAt

    const failed = result.feeds.filter((feed) => feed.error)
    const syncedAt = new Date().toISOString()

    return NextResponse.json({
      apartmentId,
      syncedAt,
      durationMs,
      created: result.feeds.reduce((sum, feed) => sum + feed.created, 0),
      updated: result.feeds.reduce((sum, feed) => sum + feed.updated, 0),
      deleted: result.feeds.reduce((sum, feed) => sum + feed.deleted, 0),
      feeds: result.feeds,
      error: failed.length > 0 ? failed.map((feed) => `${feed.provider}: ${feed.error}`).join("; ") : null
    })
  } catch (error) {
    if (error instanceof ReservationValidationError) {
      return NextResponse.json({ error: error.message }, { status: 422 })
    }

    console.error("Failed to sync apartment", error)
    return NextResponse.json({ error: "Synchronizaci se nepodařilo spustit." }, { status: 500 })
  }
}
