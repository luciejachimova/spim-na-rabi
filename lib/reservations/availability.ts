import { prisma } from "../db"
import type { BlockedRange } from "./overlap"
import { BLOCKING_STATUSES } from "./status"
import type { ReservationSource, ReservationStatus } from "./types"

export async function listBlockedRanges(options?: { fromDate?: string }): Promise<BlockedRange[]> {
  const reservations = await prisma.reservation.findMany({
    where: {
      status: { in: [...BLOCKING_STATUSES] },
      ...(options?.fromDate ? { endDate: { gte: options.fromDate } } : {})
    },
    select: {
      id: true,
      apartmentId: true,
      startDate: true,
      endDate: true,
      status: true,
      source: true,
      name: true
    },
    orderBy: [{ startDate: "asc" }, { id: "asc" }]
  })

  return reservations.map((reservation) => ({
    id: reservation.id,
    apartmentId: reservation.apartmentId,
    startDate: reservation.startDate,
    endDate: reservation.endDate,
    status: reservation.status as ReservationStatus,
    source: reservation.source as ReservationSource,
    // Blocks and iCal imports often have no guest name; the form only needs
    // something to name the clashing row with.
    label: reservation.name?.trim() || (reservation.source === "admin_block" ? "Blokace" : "Rezervace")
  }))
}
