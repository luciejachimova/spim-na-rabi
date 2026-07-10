export const PRAGUE_TIME_ZONE = "Europe/Prague"

export function toUtcDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function formatDateForPrague(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: PRAGUE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date)
}

// Locale-aware display of a YYYY-MM-DD date key. Formatted in UTC so the
// calendar day never shifts across time zones (the key has no time component).
export function formatReservationDate(dateKey: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    day: "numeric",
    month: "numeric",
    year: "numeric"
  }).format(toUtcDate(dateKey))
}

export function addDaysToKey(dateKey: string, amount: number) {
  const date = toUtcDate(dateKey)
  date.setUTCDate(date.getUTCDate() + amount)
  return formatDateForPrague(date)
}

// Used to hour-gate same-day scheduled sends (e.g. "don't send the departure
// reminder before 9am Prague time"). The `% 24` guards Intl's documented
// quirk of formatting midnight as "24" rather than "00" with hour12: false.
export function getPragueHour(date: Date) {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: PRAGUE_TIME_ZONE,
    hour: "2-digit",
    hour12: false
  }).format(date)
  return Number(formatted) % 24
}
