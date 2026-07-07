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
  importantInfo: string[] | null
  bookingReviewUrl: string | null
  airbnbReviewUrl: string | null
}

// Both apartments are in the same building with shared parking, key pickup,
// and house rules — one shared definition, reused for each slug below.
const sharedGuestInfo: ApartmentGuestInfo = {
  address: "Rabí 175, 342 01 Rabí",
  googleMapsUrl: "https://maps.app.goo.gl/rvnBGyCy46HEZK247",
  checkInTime: "od 15:00",
  checkOutTime: "do 11:00",
  parkingInfo:
    "Parkovat můžete kdekoliv na vyhrazených parkovacích místech v obci. Při příjezdu od nás obdržíte parkovací kartu, kterou si prosím umístěte viditelně za čelní sklo vozidla po celou dobu pobytu.",
  wifiNetwork: null,
  wifiPassword: null,
  keyInstructions:
    "Klíče si prosím vyzvedněte v kavárně Hraběnka, která se nachází hned vedle vstupu do apartmánů. Pokud přijedete mimo otevírací dobu nebo budete potřebovat s čímkoliv poradit, zavolejte nám na +420 723 936 426.",
  importantInfo: [
    "Prosíme o dodržování nočního klidu od 22:00 do 6:00.",
    "V celém objektu je zakázáno kouřit.",
    "Pokud cestujete s domácím mazlíčkem, dejte nám to prosím vědět předem.",
    "Před odjezdem prosím zavřete okna, zhasněte světla a vraťte klíče podle pokynů."
  ],
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

export function getGuestInfo(apartmentSlug: string): ApartmentGuestInfo {
  return guestInfoByApartment[apartmentSlug] ?? EMPTY_GUEST_INFO
}
