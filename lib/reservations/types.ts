import type { Apartment as PrismaApartment, IcalFeed as PrismaIcalFeed } from "@prisma/client"

export type ReservationSource = "website" | "booking" | "airbnb" | "phone" | "email" | "admin_block"
// "active" is the pre-migration value, kept only until the production
// migration has run — see the enum in schema.prisma and docs/RELEASE.md.
// Nothing writes it; SELECTABLE_STATUSES keeps it out of the UI.
export type ReservationStatus = "inquiry" | "confirmed" | "cancelled" | "no_show" | "active"
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
  guestId: string | null
  startDate: string
  endDate: string
  source: ReservationSource
  status: ReservationStatus
  externalUid: string | null
  name: string | null
  email: string | null
  phone: string | null
  /** @deprecated Legacy total, kept in sync as adults + children. Use those. */
  guests: number | null
  adults: number
  children: number
  childrenAges: string | null
  hasDog: boolean
  dogsCount: number
  priceCents: number | null
  currency: string
  depositCents: number | null
  isPaid: boolean
  cityTaxCents: number | null
  note: string | null
  guestNote: string | null
  arrivalTime: string | null
  departureTime: string | null
  cancelledAt: string | null
  cancelReason: string | null
  lastSyncedAt: string | null
  manualEditedAt: string | null
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

/** Everything the manager form collects. Shared by create and edit. */
export interface ManualReservationInput {
  apartmentId: number
  startDate: string
  endDate: string
  source: ReservationSource
  status: ReservationStatus
  name?: string | null
  email?: string | null
  phone?: string | null
  adults: number
  children: number
  childrenAges?: string | null
  hasDog: boolean
  dogsCount: number
  priceCents?: number | null
  currency?: string
  depositCents?: number | null
  isPaid?: boolean
  note?: string | null
  guestNote?: string | null
  arrivalTime?: string | null
  departureTime?: string | null
  locale?: string
}

// Every field is optional except the apartment and the dates: an absent field
// means "leave what is stored", which is what lets the older admin API keep
// sending its four fields while the manager form sends all of them.
export interface UpdateReservationInput {
  apartmentId: number
  startDate: string
  endDate: string
  source?: ReservationSource
  status?: ReservationStatus
  name?: string | null
  email?: string | null
  phone?: string | null
  /** @deprecated Superseded by `adults` + `children`; still accepted so the
   * existing admin API keeps working. Used only when `adults` is absent. */
  guests?: number | null
  adults?: number | null
  children?: number | null
  childrenAges?: string | null
  hasDog?: boolean
  dogsCount?: number
  priceCents?: number | null
  currency?: string
  depositCents?: number | null
  isPaid?: boolean
  note?: string | null
  guestNote?: string | null
  arrivalTime?: string | null
  departureTime?: string | null
  cancelReason?: string | null
}

export interface IcalImportResult {
  apartmentId: number
  apartmentSlug: string
  apartmentName: string
  provider: IcalProvider
  fetchedEvents: number
  created: number
  updated: number
  cancelled: number
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
  guest_id: string | null
  start_date: string
  end_date: string
  source: ReservationSource
  status: ReservationStatus
  external_uid: string | null
  name: string | null
  email: string | null
  phone: string | null
  guests: number | bigint | null
  adults: number | bigint
  children: number | bigint
  children_ages: string | null
  has_dog: number | bigint | boolean
  dogs_count: number | bigint
  price_cents: number | bigint | null
  currency: string
  deposit_cents: number | bigint | null
  is_paid: number | bigint | boolean
  city_tax_cents: number | bigint | null
  guest_note: string | null
  arrival_time: string | null
  departure_time: string | null
  cancelled_at: Date | string | null
  cancel_reason: string | null
  last_synced_at: Date | string | null
  manual_edited_at: Date | string | null
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
