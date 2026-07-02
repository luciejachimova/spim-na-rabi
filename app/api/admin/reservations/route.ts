import { NextResponse } from "next/server"
import { listAllReservations } from "@/lib/reservations"

export const runtime = "nodejs"

export async function GET() {
  const reservations = await listAllReservations()
  return NextResponse.json({ reservations })
}
