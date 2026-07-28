import icalParser from "node-ical"
import { prisma } from "../db"
import { ReservationError } from "../reservations/errors"
import type { IcalFeedWithApartment, IcalImportResult, IcalProvider } from "../reservations/types"
import { isCancelledEntry, isIcalEntry, normalizeBookingEvent } from "./parser"

export async function importIcalFeed(feed: IcalFeedWithApartment): Promise<IcalImportResult> {
  const provider = feed.provider as IcalProvider

  let response: Response
  try {
    response = await fetch(feed.url, {
      headers: { Accept: "text/calendar, text/plain;q=0.8, */*;q=0.5" }
    })
  } catch {
    const message = `iCal (${provider}) se nepodařilo stáhnout pro ${feed.apartment.name}.`
    await prisma.icalFeed.update({ where: { id: feed.id }, data: { lastSyncError: message } }).catch(() => {})
    throw new ReservationError(message)
  }

  if (!response.ok) {
    const message = `iCal (${provider}) se nepodařilo stáhnout pro ${feed.apartment.name}.`
    await prisma.icalFeed.update({ where: { id: feed.id }, data: { lastSyncError: message } }).catch(() => {})
    throw new ReservationError(message)
  }

  const text = await response.text()
  const parsed = icalParser.parseICS(text)
  const importedUids = new Set<string>()
  let created = 0
  let updated = 0

  for (const entry of Object.values(parsed)) {
    if (!isIcalEntry(entry) || entry.type !== "VEVENT") {
      continue
    }

    const normalized = normalizeBookingEvent(entry)
    if (!normalized) {
      continue
    }

    importedUids.add(normalized.externalUid)

    if (isCancelledEntry(entry)) {
      await prisma.reservation.deleteMany({
        where: { apartmentId: feed.apartmentId, source: provider, externalUid: normalized.externalUid }
      })
      continue
    }

    const data = {
      apartmentId: feed.apartmentId,
      startDate: normalized.startDate,
      endDate: normalized.endDate,
      source: provider,
      status: "active" as const,
      externalUid: normalized.externalUid,
      name: normalized.name || feed.apartment.name,
      email: null,
      phone: null,
      guests: null,
      note: normalized.note
    }

    const existing = await prisma.reservation.findUnique({
      where: {
        apartmentId_source_externalUid: {
          apartmentId: feed.apartmentId,
          source: provider,
          externalUid: normalized.externalUid
        }
      }
    })

    if (existing) {
      await prisma.reservation.update({ where: { id: existing.id }, data })
      updated += 1
    } else {
      await prisma.reservation.create({ data })
      created += 1
    }
  }

  const existingFeedReservations = await prisma.reservation.findMany({
    where: { apartmentId: feed.apartmentId, source: provider }
  })

  const staleReservations = existingFeedReservations.filter(
    (reservation) => !reservation.externalUid || !importedUids.has(reservation.externalUid)
  )

  if (staleReservations.length > 0) {
    await prisma.reservation.deleteMany({
      where: { id: { in: staleReservations.map((reservation) => reservation.id) } }
    })
  }

  await prisma.icalFeed.update({
    where: { id: feed.id },
    data: { lastSyncedAt: new Date(), lastSyncError: null }
  })

  return {
    apartmentId: feed.apartmentId,
    apartmentSlug: feed.apartment.slug,
    apartmentName: feed.apartment.name,
    provider,
    fetchedEvents: importedUids.size,
    created,
    updated,
    deleted: staleReservations.length,
    error: null
  }
}
