import { NextResponse } from "next/server"
import { syncApartment, syncAllApartments, ReservationValidationError } from "@/lib/reservations"

export const runtime = "nodejs"

interface SyncRequestBody {
  apartmentId?: unknown
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SyncRequestBody | null
  const hasApartmentId = body?.apartmentId !== undefined && body?.apartmentId !== null
  const apartmentId = hasApartmentId ? Number(body?.apartmentId) : null

  if (hasApartmentId && !Number.isInteger(apartmentId)) {
    return NextResponse.json({ error: "Vyberte apartmán k synchronizaci." }, { status: 422 })
  }

  try {
    const startedAt = Date.now()
    const result = apartmentId !== null ? await syncApartment(apartmentId) : await syncAllApartments()
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

    console.error("Failed to sync apartment(s)", error)
    return NextResponse.json({ error: "Synchronizaci se nepodařilo spustit." }, { status: 500 })
  }
}
