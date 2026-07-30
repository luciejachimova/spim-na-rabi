import { onReservationCancelled } from "../cleaning/hooks"
import { prisma } from "../db"
import { ReservationNotFoundError } from "./errors"
import { toReservationWithApartment } from "./mappers"
import type { ReservationStatus, ReservationWithApartment } from "./types"

export async function cancelReservation(
  reservationId: number,
  reason: string | null = null
): Promise<ReservationWithApartment> {
  const existing = await prisma.reservation.findUnique({ where: { id: reservationId } })
  if (!existing) {
    throw new ReservationNotFoundError("Rezervace nebyla nalezena.")
  }

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: "cancelled",
      cancelledAt: existing.cancelledAt ?? new Date(),
      cancelReason: reason ?? existing.cancelReason
    },
    include: { apartment: true }
  })

  await onReservationCancelled({
    reservationId: updated.id,
    apartmentId: updated.apartmentId,
    previousStatus: existing.status as ReservationStatus,
    startDate: updated.startDate,
    endDate: updated.endDate,
    reason
  })

  return toReservationWithApartment(updated, updated.apartment)
}

// Hard delete, kept for genuinely unwanted rows (a test booking, a duplicate).
// The iCal importer no longer uses it: a reservation that disappears from a
// feed is cancelled, not deleted, so statistics and its cleaning history
// survive.
export async function deleteReservationPermanently(reservationId: number): Promise<void> {
  const existing = await prisma.reservation.findUnique({ where: { id: reservationId } })
  if (!existing) {
    throw new ReservationNotFoundError("Rezervace nebyla nalezena.")
  }

  await prisma.reservation.delete({ where: { id: reservationId } })
}
