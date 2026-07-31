import { ReservationValidationError } from "./errors"
import type { IcalProvider } from "./types"

export function parseDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ReservationValidationError("Datum musí mít formát YYYY-MM-DD.", "dateFormat")
  }

  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new ReservationValidationError("Datum není platné.", "dateInvalid")
  }

  return value
}

// Half-open interval [startDate, endDate): a departure and an arrival on the
// same day don't overlap.
export function areDatesValid(startDate: string, endDate: string) {
  return startDate < endDate
}

export function validateEmailFormat(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ReservationValidationError("Zadejte platný email.", "emailInvalid")
  }
}

export function validateGuestsCount(guests: number) {
  if (!Number.isInteger(guests) || guests <= 0) {
    throw new ReservationValidationError("Počet hostů musí být celé číslo větší než 0.", "guestsInvalid")
  }
}

export interface OccupancyInput {
  adults: number
  children: number
  hasDog: boolean
  dogsCount: number
  /** An owner's block has no occupants, so the "at least one adult" rule
   * doesn't apply to it. */
  isBlock?: boolean
}

// Deliberately does not enforce the apartment's capacity. The owner sometimes
// knowingly takes a fifth guest or an extra cot, and a domain layer that
// refuses the booking would just get worked around. Capacity is surfaced as a
// warning in the form instead.
export function validateOccupancy(input: OccupancyInput) {
  const adults = Math.trunc(Number(input.adults))
  const children = Math.trunc(Number(input.children))
  const dogsCount = Math.trunc(Number(input.dogsCount))

  if (!Number.isFinite(adults) || adults < 0) {
    throw new ReservationValidationError("Počet dospělých nesmí být negativní.", "adultsInvalid")
  }
  if (!Number.isFinite(children) || children < 0) {
    throw new ReservationValidationError("Počet dětí nesmí být negativní.", "childrenInvalid")
  }
  if (!input.isBlock && adults + children < 1) {
    throw new ReservationValidationError("Rezervace musí mít aspoň jednoho hosta.", "guestsRequired")
  }

  const hasDog = Boolean(input.hasDog)
  if (hasDog && dogsCount < 1) {
    throw new ReservationValidationError("U pobytu se psem uveďte počet psů.", "dogsCountRequired")
  }

  return { adults, children, hasDog, dogsCount: hasDog ? dogsCount : 0 }
}

// Money arrives from the form as whole haléře. Guard against the two ways that
// goes wrong: a negative amount, and a non-integer that would have come from
// multiplying a float by 100 somewhere upstream.
export function validatePrice(priceCents: number | null | undefined) {
  if (priceCents === null || priceCents === undefined) return null

  if (!Number.isInteger(priceCents) || priceCents < 0) {
    throw new ReservationValidationError("Cena musí být nezáporné číslo.", "priceInvalid")
  }

  return priceCents
}

export function validateIcalFeedUrl(provider: IcalProvider, url: string) {
  if (!/^https?:\/\//i.test(url)) {
    throw new ReservationValidationError("URL musí začínat http:// nebo https://.")
  }

  if (provider === "booking" && !/booking/i.test(url)) {
    throw new ReservationValidationError("Booking.com URL musí obsahovat „booking“.")
  }

  if (provider === "airbnb" && !/airbnb/i.test(url)) {
    throw new ReservationValidationError("Airbnb URL musí obsahovat „airbnb“.")
  }
}
