import { NextRequest, NextResponse } from "next/server"
import { buildApartmentIcal, getApartmentBySelection, getApartmentIcalFilename } from "@/lib/reservations"

export const runtime = "nodejs"

interface RouteContext {
  params: Promise<{
    apartmentId: string
  }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { apartmentId } = await context.params
  const apartment = await getApartmentBySelection(apartmentId)

  if (!apartment) {
    return NextResponse.json({ error: "Apartmán nebyl nalezen." }, { status: 404 })
  }

  const calendar = await buildApartmentIcal(apartment)

  return new NextResponse(calendar.toString(), {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${getApartmentIcalFilename(apartment)}"`,
      "Cache-Control": "no-store"
    }
  })
}
