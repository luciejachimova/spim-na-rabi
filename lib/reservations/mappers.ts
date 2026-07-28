import type {
  Apartment as PrismaApartment,
  IcalFeed as PrismaIcalFeed,
  Reservation as PrismaReservation
} from "@prisma/client"
import type {
  ApartmentRecord,
  IcalFeedRecord,
  IcalProvider,
  RawReservationRow,
  ReservationSource,
  ReservationStatus,
  ReservationWithApartment
} from "./types"
import { getPublicIcalUrl } from "./urls"

export function mapApartment(apartment: PrismaApartment): ApartmentRecord {
  const record: ApartmentRecord = {
    id: apartment.id,
    slug: apartment.slug,
    name: apartment.name,
    publicIcalUrl: apartment.publicIcalUrl
  }

  // Always resolve to a real URL (falls back to PUBLIC_APP_URL) rather than
  // exposing a possibly-null/stale stored column to callers like the admin UI.
  return { ...record, publicIcalUrl: getPublicIcalUrl(record) }
}

export function mapIcalFeed(feed: PrismaIcalFeed): IcalFeedRecord {
  return {
    id: feed.id,
    apartmentId: feed.apartmentId,
    provider: feed.provider as IcalProvider,
    url: feed.url,
    lastSyncedAt: feed.lastSyncedAt ? feed.lastSyncedAt.toISOString() : null,
    lastSyncError: feed.lastSyncError
  }
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value
}

function toNullableIsoString(value: Date | string | null) {
  return value === null ? null : toIsoString(value)
}

export function toReservationWithApartment(
  reservation: PrismaReservation,
  apartment: Pick<ApartmentRecord, "slug" | "name">
): ReservationWithApartment {
  return {
    id: reservation.id,
    apartmentId: reservation.apartmentId,
    startDate: reservation.startDate,
    endDate: reservation.endDate,
    source: reservation.source as ReservationSource,
    status: reservation.status as ReservationStatus,
    externalUid: reservation.externalUid,
    name: reservation.name,
    email: reservation.email,
    phone: reservation.phone,
    guests: reservation.guests,
    note: reservation.note,
    locale: reservation.locale,
    reservationToken: reservation.reservationToken,
    confirmationEmailedAt: toNullableIsoString(reservation.confirmationEmailedAt),
    confirmationEmailAttempts: reservation.confirmationEmailAttempts,
    arrivalInfoEmailedAt: toNullableIsoString(reservation.arrivalInfoEmailedAt),
    arrivalInfoEmailAttempts: reservation.arrivalInfoEmailAttempts,
    departureReminderEmailedAt: toNullableIsoString(reservation.departureReminderEmailedAt),
    departureReminderEmailAttempts: reservation.departureReminderEmailAttempts,
    thankYouEmailedAt: toNullableIsoString(reservation.thankYouEmailedAt),
    thankYouEmailAttempts: reservation.thankYouEmailAttempts,
    lastEmailError: reservation.lastEmailError,
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
    apartmentSlug: apartment.slug,
    apartmentName: apartment.name
  }
}

export function mapRawReservationRow(
  row: RawReservationRow,
  apartment: Pick<ApartmentRecord, "slug" | "name">
): ReservationWithApartment {
  return {
    id: Number(row.id),
    apartmentId: Number(row.apartment_id),
    startDate: row.start_date,
    endDate: row.end_date,
    source: row.source,
    status: row.status,
    externalUid: row.external_uid,
    name: row.name,
    email: row.email,
    phone: row.phone,
    guests: row.guests === null ? null : Number(row.guests),
    note: row.note,
    locale: row.locale,
    reservationToken: row.reservation_token,
    confirmationEmailedAt: toNullableIsoString(row.confirmation_emailed_at),
    confirmationEmailAttempts: Number(row.confirmation_email_attempts),
    arrivalInfoEmailedAt: toNullableIsoString(row.arrival_info_emailed_at),
    arrivalInfoEmailAttempts: Number(row.arrival_info_email_attempts),
    departureReminderEmailedAt: toNullableIsoString(row.departure_reminder_emailed_at),
    departureReminderEmailAttempts: Number(row.departure_reminder_email_attempts),
    thankYouEmailedAt: toNullableIsoString(row.thank_you_emailed_at),
    thankYouEmailAttempts: Number(row.thank_you_email_attempts),
    lastEmailError: row.last_email_error,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    apartmentSlug: apartment.slug,
    apartmentName: apartment.name
  }
}
