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
