import { NextResponse } from "next/server"
import { listApartmentsWithFeeds, upsertIcalFeed, ReservationValidationError } from "@/lib/reservations"

export const runtime = "nodejs"

interface IcalFeedRequestBody {
  apartmentId?: unknown
  provider?: unknown
  url?: unknown
}

export async function GET() {
  const apartments = await listApartmentsWithFeeds()
  return NextResponse.json({ apartments })
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as IcalFeedRequestBody | null

  const apartmentId = Number(body?.apartmentId)
  const provider = body?.provider
  const url = typeof body?.url === "string" ? body.url : ""

  if (!Number.isInteger(apartmentId) || (provider !== "booking" && provider !== "airbnb") || !url) {
    return NextResponse.json({ error: "Vyplňte apartmán, poskytovatele a URL." }, { status: 422 })
  }

  try {
    const feed = await upsertIcalFeed({ apartmentId, provider, url })
    return NextResponse.json({ feed })
  } catch (error) {
    if (error instanceof ReservationValidationError) {
      return NextResponse.json({ error: error.message }, { status: 422 })
    }

    console.error("Failed to save ical feed", error)
    return NextResponse.json({ error: "Feed se nepodařilo uložit." }, { status: 500 })
  }
}
