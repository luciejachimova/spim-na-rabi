import type { Apartment as PrismaApartment, IcalFeed as PrismaIcalFeed } from "@prisma/client"

export type ReservationSource = "website" | "booking" | "airbnb" | "admin_block"
export type ReservationStatus = "active" | "cancelled"
export type IcalProvider = "booking" | "airbnb"

export interface ApartmentRecord {
  id: number
  slug: string
  name: string
  publicIcalUrl: string | null
}

export interface IcalFeedRecord {
  id: number
  apartmentId: number
  provider: IcalProvider
  url: string
  lastSyncedAt: string | null
  lastSyncError: string | null
}

export interface ApartmentWithFeeds extends ApartmentRecord {
  icalFeeds: IcalFeedRecord[]
}

export interface ReservationRecord {
  id: number
  apartmentId: number
  startDate: string
  endDate: string
  source: ReservationSource
  status: ReservationStatus
  externalUid: string | null
  name: string | null
  email: string | null
  phone: string | null
  guests: number | null
  note: string | null
  locale: string
  reservationToken: string | null
  confirmationEmailedAt: string | null
  confirmationEmailAttempts: number
  arrivalInfoEmailedAt: string | null
  arrivalInfoEmailAttempts: number
  departureReminderEmailedAt: string | null
  departureReminderEmailAttempts: number
  thankYouEmailedAt: string | null
  thankYouEmailAttempts: number
  lastEmailError: string | null
  createdAt: string
  updatedAt: string
}

export interface ReservationWithApartment extends ReservationRecord {
  apartmentSlug: string
  apartmentName: string
}

export interface WebsiteReservationInput {
  name: string
  email: string
  phone?: string
  apartmentSelection: string
  startDate: string
  endDate: string
  guests: number
  note?: string
  locale?: string
}

export interface AdminBlockInput {
  apartmentId: number
  startDate: string
  endDate: string
  note?: string
}

export interface UpdateReservationInput {
  apartmentId: number
  startDate: string
  endDate: string
  name?: string | null
  email?: string | null
  phone?: string | null
  guests?: number | null
  note?: string | null
}

export interface IcalImportResult {
  apartmentId: number
  apartmentSlug: string
  apartmentName: string
  provider: IcalProvider
  fetchedEvents: number
  created: number
  updated: number
  deleted: number
  error: string | null
}

export interface SyncResult {
  feeds: IcalImportResult[]
}

export type IcalFeedWithApartment = PrismaIcalFeed & { apartment: PrismaApartment }

// Shape returned by the raw-SQL insert/update statements in create.ts and
// update.ts. Snake-cased because it comes straight from SQLite, and the
// numeric columns are typed as `number | bigint` because the libSQL driver
// returns BIGINT-ish values for INTEGER columns.
export interface RawReservationRow {
  id: number | bigint
  apartment_id: number | bigint
  start_date: string
  end_date: string
  source: ReservationSource
  status: ReservationStatus
  external_uid: string | null
  name: string | null
  email: string | null
  phone: string | null
  guests: number | bigint | null
  note: string | null
  locale: string
  reservation_token: string | null
  confirmation_emailed_at: Date | string | null
  confirmation_email_attempts: number | bigint
  arrival_info_emailed_at: Date | string | null
  arrival_info_email_attempts: number | bigint
  departure_reminder_emailed_at: Date | string | null
  departure_reminder_email_attempts: number | bigint
  thank_you_emailed_at: Date | string | null
  thank_you_email_attempts: number | bigint
  last_email_error: string | null
  created_at: Date | string
  updated_at: Date | string
}
