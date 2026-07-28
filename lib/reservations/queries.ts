import { prisma } from "../db"
import { ReservationNotFoundError } from "./errors"
import { mapApartment, mapIcalFeed, toReservationWithApartment } from "./mappers"
import type { ApartmentRecord, ApartmentWithFeeds, ReservationWithApartment } from "./types"

export async function listApartments(): Promise<ApartmentRecord[]> {
  const apartments = await prisma.apartment.findMany({ orderBy: [{ name: "asc" }, { id: "asc" }] })
  return apartments.map(mapApartment)
}

export async function listApartmentsWithFeeds(): Promise<ApartmentWithFeeds[]> {
  const apartments = await prisma.apartment.findMany({
    orderBy: [{ name: "asc" }, { id: "asc" }],
    include: { icalFeeds: true }
  })

  return apartments.map((apartment) => ({
    ...mapApartment(apartment),
    icalFeeds: apartment.icalFeeds.map(mapIcalFeed)
  }))
}

export async function getApartmentBySelection(selection: string): Promise<ApartmentRecord | null> {
  const trimmed = selection.trim()
  if (!trimmed) {
    return null
  }

  const numericId = /^\d+$/.test(trimmed) ? Number(trimmed) : null

  const apartment = await prisma.apartment.findFirst({
    where: numericId !== null ? { OR: [{ slug: trimmed }, { id: numericId }] } : { slug: trimmed }
  })

  return apartment ? mapApartment(apartment) : null
}

export async function getApartmentBySlug(slug: string): Promise<ApartmentRecord | null> {
  const apartment = await prisma.apartment.findUnique({ where: { slug } })
  return apartment ? mapApartment(apartment) : null
}

export async function getApartmentById(apartmentId: number): Promise<ApartmentRecord | null> {
  const apartment = await prisma.apartment.findUnique({ where: { id: apartmentId } })
  return apartment ? mapApartment(apartment) : null
}

export async function listReservationsForApartment(apartmentId: number): Promise<ReservationWithApartment[]> {
  const apartment = await getApartmentById(apartmentId)
  if (!apartment) {
    throw new ReservationNotFoundError("Apartmán nebyl nalezen.")
  }

  const reservations = await prisma.reservation.findMany({
    where: { apartmentId },
    orderBy: [{ startDate: "asc" }, { id: "asc" }]
  })

  return reservations.map((reservation) => toReservationWithApartment(reservation, apartment))
}

export async function listAllReservations(): Promise<ReservationWithApartment[]> {
  const reservations = await prisma.reservation.findMany({
    include: { apartment: true },
    orderBy: [{ startDate: "asc" }, { id: "asc" }]
  })

  return reservations.map((reservation) => toReservationWithApartment(reservation, reservation.apartment))
}

export async function getReservationByToken(token: string): Promise<ReservationWithApartment | null> {
  const reservation = await prisma.reservation.findUnique({
    where: { reservationToken: token },
    include: { apartment: true }
  })

  return reservation ? toReservationWithApartment(reservation, reservation.apartment) : null
}
