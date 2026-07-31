import type { ApartmentRecord } from "./types"

// Kept in their own dependency-free module to break an import cycle:
// mappers.ts needs getPublicIcalUrl (mapApartment resolves the stored column
// to a real URL), while ical/export.ts needs queries.ts, which needs
// mappers.ts. Leaving these three functions in ical/export.ts would close
// that loop.
const DEFAULT_BASE_URL = "http://localhost:3000"

export function getBaseUrl() {
  return (process.env.PUBLIC_APP_URL || DEFAULT_BASE_URL).replace(/\/$/, "")
}

export function getApartmentIcalFilename(apartment: ApartmentRecord) {
  return `${apartment.slug}.ics`
}

export function getPublicIcalUrl(apartment: ApartmentRecord) {
  return apartment.publicIcalUrl || `${getBaseUrl()}/api/ical/${apartment.slug}`
}
