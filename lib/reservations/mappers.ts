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

// SQLite has no boolean type and the libSQL driver hands INTEGER columns back
// as number|bigint, so a raw-SQL row carries 0/1 where Prisma would give true.
function toBoolean(value: number | bigint | boolean) {
  return typeof value === "boolean" ? value : Number(value) !== 0
}

function toNullableNumber(value: number | bigint | null) {
  return value === null ? null : Number(value)
}

export function toReservationWithApartment(
  reservation: PrismaReservation,
  apartment: Pick<ApartmentRecord, "slug" | "name">
): ReservationWithApartment {
  return {
    id: reservation.id,
    apartmentId: reservation.apartmentId,
    guestId: reservation.guestId,
    startDate: reservation.startDate,
    endDate: reservation.endDate,
    source: reservation.source as ReservationSource,
    status: reservation.status as ReservationStatus,
    externalUid: reservation.externalUid,
    name: reservation.name,
    email: reservation.email,
    phone: reservation.phone,
    guests: reservation.guests,
    adults: reservation.adults,
    children: reservation.children,
    childrenAges: reservation.childrenAges,
    hasDog: reservation.hasDog,
    dogsCount: reservation.dogsCount,
    priceCents: reservation.priceCents,
    currency: reservation.currency,
    depositCents: reservation.depositCents,
    isPaid: reservation.isPaid,
    cityTaxCents: reservation.cityTaxCents,
    note: reservation.note,
    guestNote: reservation.guestNote,
    arrivalTime: reservation.arrivalTime,
    departureTime: reservation.departureTime,
    cancelledAt: toNullableIsoString(reservation.cancelledAt),
    cancelReason: reservation.cancelReason,
    lastSyncedAt: toNullableIsoString(reservation.lastSyncedAt),
    manualEditedAt: toNullableIsoString(reservation.manualEditedAt),
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
    guestId: row.guest_id,
    startDate: row.start_date,
    endDate: row.end_date,
    source: row.source,
    status: row.status,
    externalUid: row.external_uid,
    name: row.name,
    email: row.email,
    phone: row.phone,
    guests: toNullableNumber(row.guests),
    adults: Number(row.adults),
    children: Number(row.children),
    childrenAges: row.children_ages,
    hasDog: toBoolean(row.has_dog),
    dogsCount: Number(row.dogs_count),
    priceCents: toNullableNumber(row.price_cents),
    currency: row.currency,
    depositCents: toNullableNumber(row.deposit_cents),
    isPaid: toBoolean(row.is_paid),
    cityTaxCents: toNullableNumber(row.city_tax_cents),
    note: row.note,
    guestNote: row.guest_note,
    arrivalTime: row.arrival_time,
    departureTime: row.departure_time,
    cancelledAt: toNullableIsoString(row.cancelled_at),
    cancelReason: row.cancel_reason,
    lastSyncedAt: toNullableIsoString(row.last_synced_at),
    manualEditedAt: toNullableIsoString(row.manual_edited_at),
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
