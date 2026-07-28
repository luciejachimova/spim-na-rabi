import { prisma } from "../db"
import { ReservationNotFoundError } from "./errors"
import { toReservationWithApartment } from "./mappers"
import type { ReservationWithApartment } from "./types"

export async function cancelReservation(reservationId: number): Promise<ReservationWithApartment> {
  const existing = await prisma.reservation.findUnique({ where: { id: reservationId } })
  if (!existing) {
    throw new ReservationNotFoundError("Rezervace nebyla nalezena.")
  }

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "cancelled" },
    include: { apartment: true }
  })

  return toReservationWithApartment(updated, updated.apartment)
}

export async function deleteReservationPermanently(reservationId: number): Promise<void> {
  const existing = await prisma.reservation.findUnique({ where: { id: reservationId } })
  if (!existing) {
    throw new ReservationNotFoundError("Rezervace nebyla nalezena.")
  }

  await prisma.reservation.delete({ where: { id: reservationId } })
}
