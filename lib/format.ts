// Pure formatting shared by server and client components in the manager.

import { toUtcDate } from "./prague-date"

/** 840000 haléřů → "8 400 Kč". Whole crowns unless the amount has haléře. */
export function formatMoney(cents: number | null | undefined, currency = "CZK") {
  if (cents === null || cents === undefined) return null
  const hasFraction = cents % 100 !== 0
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0
  }).format(cents / 100)
}

/** 840000 → "8400" for a text input. Empty string for null. */
export function centsToInput(cents: number | null | undefined) {
  if (cents === null || cents === undefined) return ""
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2)
}

/**
 * "8 400", "8400,50", "8 400.50" → haléře. Returns null for an empty input and
 * undefined when the text isn't a number at all, so the caller can tell
 * "cleared" apart from "typo".
 */
export function inputToCents(value: string | null | undefined): number | null | undefined {
  if (value === null || value === undefined) return null
  // Strips ordinary spaces, non-breaking spaces (what a copy-paste from a
  // Booking invoice contains) and the crown sign.
  const cleaned = value.replace(/[\s  ]/g, "").replace(/kč/gi, "").replace(",", ".")
  if (!cleaned) return null
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return undefined
  return Math.round(Number(cleaned) * 100)
}

/** "2026-08-10" → "10. 8. 2026" */
export function formatDate(dateKey: string) {
  return new Intl.DateTimeFormat("cs-CZ", { timeZone: "UTC", day: "numeric", month: "numeric", year: "numeric" }).format(
    toUtcDate(dateKey)
  )
}

/** "2026-08-10" → "10. 8." — for ranges inside one year. */
export function formatDateShort(dateKey: string) {
  return new Intl.DateTimeFormat("cs-CZ", { timeZone: "UTC", day: "numeric", month: "numeric" }).format(toUtcDate(dateKey))
}

/** "2026-08-10" → "po" */
export function formatWeekday(dateKey: string) {
  return new Intl.DateTimeFormat("cs-CZ", { timeZone: "UTC", weekday: "short" }).format(toUtcDate(dateKey))
}

/** Collapses a stay into "10.–14. 8. 2026", dropping the repeated month/year. */
export function formatDateRange(startDate: string, endDate: string) {
  const sameYear = startDate.slice(0, 4) === endDate.slice(0, 4)
  const sameMonth = sameYear && startDate.slice(0, 7) === endDate.slice(0, 7)

  if (sameMonth) {
    return `${Number(startDate.slice(8, 10))}.–${formatDate(endDate)}`
  }
  if (sameYear) {
    return `${formatDateShort(startDate)} – ${formatDate(endDate)}`
  }
  return `${formatDate(startDate)} – ${formatDate(endDate)}`
}

export function formatNights(nights: number) {
  if (nights === 1) return "1 noc"
  if (nights >= 2 && nights <= 4) return `${nights} noci`
  return `${nights} nocí`
}

export function formatGuests(adults: number, children: number) {
  const parts: string[] = []
  if (adults > 0) parts.push(adults === 1 ? "1 dospělý" : `${adults} dospělí`)
  if (children > 0) parts.push(children === 1 ? "1 dítě" : children <= 4 ? `${children} děti` : `${children} dětí`)
  return parts.join(", ") || "bez hostů"
}

export function formatDogs(hasDog: boolean, dogsCount: number) {
  if (!hasDog) return null
  if (dogsCount <= 1) return "1 pes"
  return dogsCount <= 4 ? `${dogsCount} psi` : `${dogsCount} psů`
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("cs-CZ", {
    timeZone: "Europe/Prague",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso))
}
