// Structural, locale-independent stay information used on the public
// /reservation/[token] page and in the arrival-info / thank-you emails.
//
// The prose parts of the guest info (check-in/out times, parking, key pickup,
// house rules) are translated content and live in the "guestInfo" message
// namespace under /messages — read there via next-intl, not from this file.
// Only address, maps, wifi and per-channel review URLs (which are the same
// regardless of language) stay here.

export interface ApartmentGuestInfo {
  address: string | null
  googleMapsUrl: string | null
  wifiNetwork: string | null
  wifiPassword: string | null
  bookingReviewUrl: string | null
  airbnbReviewUrl: string | null
}

// Both apartments are in the same building with shared parking, key pickup,
// and house rules — one shared definition, reused for each slug below.
const sharedGuestInfo: ApartmentGuestInfo = {
  address: "Rabí 175, 342 01 Rabí",
  googleMapsUrl: "https://maps.app.goo.gl/rvnBGyCy46HEZK247",
  wifiNetwork: null,
  wifiPassword: null,
  bookingReviewUrl: null,
  airbnbReviewUrl: null
}

export const guestInfoByApartment: Record<string, ApartmentGuestInfo> = {
  "studio-3": sharedGuestInfo,
  "loft-10": sharedGuestInfo
}

export const businessInfo = {
  phone: "+420 723 936 426",
  email: "spimnarabi@seznam.cz",
  googleReviewUrl: "https://g.page/r/CeHJRB2jWnpoEAE/review" as string | null,
  signoffNames: "Lucie a Pavel"
}

const EMPTY_GUEST_INFO: ApartmentGuestInfo = {
  address: null,
  googleMapsUrl: null,
  wifiNetwork: null,
  wifiPassword: null,
  bookingReviewUrl: null,
  airbnbReviewUrl: null
}

export function getGuestInfo(apartmentSlug: string): ApartmentGuestInfo {
  return guestInfoByApartment[apartmentSlug] ?? EMPTY_GUEST_INFO
}
