// Practical stay information used in the arrival-info email and on the
// public /reservation/[token] page — kept as a static data file (same
// precedent as data/content.js) rather than a database table, since there's
// no admin UI to manage it and it changes rarely.
//
// Every per-apartment field below is optional. Templates and the reservation
// page render each section conditionally and simply omit anything that's
// null — never a placeholder or invented value. Fill in the real values here
// as they're confirmed; nothing else needs to change.

export interface ApartmentGuestInfo {
  address: string | null
  googleMapsUrl: string | null
  checkInTime: string | null
  checkOutTime: string | null
  parkingInfo: string | null
  wifiNetwork: string | null
  wifiPassword: string | null
  keyInstructions: string | null
  importantInfo: string | null
  bookingReviewUrl: string | null
  airbnbReviewUrl: string | null
}

export const guestInfoByApartment: Record<string, ApartmentGuestInfo> = {
  "studio-3": {
    address: "Rabí 175, 342 01 Rabí",
    googleMapsUrl: null,
    checkInTime: null,
    checkOutTime: null,
    parkingInfo: null,
    wifiNetwork: null,
    wifiPassword: null,
    keyInstructions: null,
    importantInfo: null,
    bookingReviewUrl: null,
    airbnbReviewUrl: null
  },
  "loft-10": {
    address: "Rabí 175, 342 01 Rabí",
    googleMapsUrl: null,
    checkInTime: null,
    checkOutTime: null,
    parkingInfo: null,
    wifiNetwork: null,
    wifiPassword: null,
    keyInstructions: null,
    importantInfo: null,
    bookingReviewUrl: null,
    airbnbReviewUrl: null
  }
}

export const businessInfo = {
  phone: "+420 723 936 426",
  email: "spimnarabi@seznam.cz",
  googleReviewUrl: null as string | null,
  signoffNames: "Lucie a Pavel"
}

export function getGuestInfo(apartmentSlug: string): ApartmentGuestInfo {
  return (
    guestInfoByApartment[apartmentSlug] ?? {
      address: null,
      googleMapsUrl: null,
      checkInTime: null,
      checkOutTime: null,
      parkingInfo: null,
      wifiNetwork: null,
      wifiPassword: null,
      keyInstructions: null,
      importantInfo: null,
      bookingReviewUrl: null,
      airbnbReviewUrl: null
    }
  )
}
