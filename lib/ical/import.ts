import icalParser from "node-ical"
import { onReservationCancelled, onReservationDatesChanged } from "../cleaning/hooks"
import { prisma } from "../db"
import { ReservationError } from "../reservations/errors"
import type { IcalFeedWithApartment, IcalImportResult, IcalProvider, ReservationStatus } from "../reservations/types"
import { isCancelledEntry, isIcalEntry, normalizeBookingEvent } from "./parser"

const CANCEL_REASON_ICAL_CANCELLED = "ical_cancelled"
const CANCEL_REASON_ICAL_DISAPPEARED = "ical_disappeared"

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
  const syncedAt = new Date()
  let created = 0
  let updated = 0
  let cancelled = 0

  for (const entry of Object.values(parsed)) {
    if (!isIcalEntry(entry) || entry.type !== "VEVENT") {
      continue
    }

    const normalized = normalizeBookingEvent(entry)
    if (!normalized) {
      continue
    }

    importedUids.add(normalized.externalUid)

    const existing = await prisma.reservation.findUnique({
      where: {
        apartmentId_source_externalUid: {
          apartmentId: feed.apartmentId,
          source: provider,
          externalUid: normalized.externalUid
        }
      }
    })

    if (isCancelledEntry(entry)) {
      // Cancel rather than delete: statistics, invoicing and the cleaning
      // history all need the row to survive.
      if (existing && existing.status !== "cancelled") {
        await prisma.reservation.update({
          where: { id: existing.id },
          data: {
            status: "cancelled",
            cancelledAt: new Date(),
            cancelReason: CANCEL_REASON_ICAL_CANCELLED,
            lastSyncedAt: syncedAt
          }
        })
        await onReservationCancelled({
          reservationId: existing.id,
          apartmentId: existing.apartmentId,
          previousStatus: existing.status as ReservationStatus,
          startDate: existing.startDate,
          endDate: existing.endDate,
          reason: CANCEL_REASON_ICAL_CANCELLED
        })
        cancelled += 1
      }
      continue
    }

    if (!existing) {
      await prisma.reservation.create({
        data: {
          apartmentId: feed.apartmentId,
          startDate: normalized.startDate,
          endDate: normalized.endDate,
          source: provider,
          status: "confirmed",
          externalUid: normalized.externalUid,
          name: normalized.name || feed.apartment.name,
          note: normalized.note,
          // Booking/Airbnb iCal feeds carry no guest count and no price.
          // 0 means "not known yet" so the UI can prompt the owner to fill
          // it in, rather than silently claiming two adults.
          adults: 0,
          children: 0,
          lastSyncedAt: syncedAt
        }
      })
      created += 1
      continue
    }

    // Field ownership. For an externally-sourced reservation the feed owns
    // only the dates and whether it exists. Name, contact, guest counts,
    // price and notes belong to the owner and must survive this sync — it
    // runs every 15 minutes, so overwriting them here would mean anything
    // typed into the admin is gone within the quarter hour.
    const datesChanged = existing.startDate !== normalized.startDate || existing.endDate !== normalized.endDate
    // A UID that disappeared and came back: the row is still there (the
    // apartment/source/UID unique key kept it), just cancelled. Without this
    // it would stay cancelled forever and the dates would silently free up.
    const needsReactivation = existing.status === "cancelled"

    if (!datesChanged && !needsReactivation) {
      // Nothing changed — skip the write entirely. At one sync every 15
      // minutes, touching every row every time would burn through Turso's
      // write allowance for no benefit.
      continue
    }

    await prisma.reservation.update({
      where: { id: existing.id },
      data: {
        startDate: normalized.startDate,
        endDate: normalized.endDate,
        status: "confirmed",
        cancelledAt: null,
        cancelReason: null,
        lastSyncedAt: syncedAt
      }
    })
    updated += 1

    if (datesChanged) {
      await onReservationDatesChanged({
        reservationId: existing.id,
        apartmentId: existing.apartmentId,
        previousStartDate: existing.startDate,
        previousEndDate: existing.endDate,
        startDate: normalized.startDate,
        endDate: normalized.endDate
      })
    }
  }

  // Rows this feed produced that are no longer in it. Already-cancelled ones
  // are skipped so repeat syncs don't rewrite cancelledAt over and over.
  const staleReservations = await prisma.reservation.findMany({
    where: {
      apartmentId: feed.apartmentId,
      source: provider,
      status: { not: "cancelled" },
      OR: [{ externalUid: null }, { externalUid: { notIn: [...importedUids] } }]
    }
  })

  for (const reservation of staleReservations) {
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: CANCEL_REASON_ICAL_DISAPPEARED,
        lastSyncedAt: syncedAt
      }
    })
    await onReservationCancelled({
      reservationId: reservation.id,
      apartmentId: reservation.apartmentId,
      previousStatus: reservation.status as ReservationStatus,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      reason: CANCEL_REASON_ICAL_DISAPPEARED
    })
    cancelled += 1
  }

  await prisma.icalFeed.update({
    where: { id: feed.id },
    data: { lastSyncedAt: syncedAt, lastSyncError: null }
  })

  return {
    apartmentId: feed.apartmentId,
    apartmentSlug: feed.apartment.slug,
    apartmentName: feed.apartment.name,
    provider,
    fetchedEvents: importedUids.size,
    created,
    updated,
    cancelled,
    error: null
  }
}
