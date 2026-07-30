// Behavioural check for the reworked iCal importer.
//
// Serves a controlled .ics over localhost, points a real IcalFeed row at it,
// and drives lib/ical/import.ts through the sequence that matters in
// production: repeat syncs, an owner's manual edit, a date change, an event
// disappearing, and the same event coming back.
//
// Run against the LOCAL sqlite file only:
//   npm run check:sync

import http from "node:http"
import { prisma } from "@/lib/db"
import { buildApartmentIcal } from "@/lib/ical/export"
import { importIcalFeed } from "@/lib/ical/import"
import { listReservationsForApartment } from "@/lib/reservations/queries"
import { isBlocking } from "@/lib/reservations/status"

let failures = 0
let checks = 0

function check(label: string, actual: unknown, expected: unknown) {
  checks += 1
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${label}${ok ? "" : `\n          čekáno: ${JSON.stringify(expected)}\n          reálně: ${JSON.stringify(actual)}`}`)
}

interface Event {
  uid: string
  start: string
  end: string
  summary: string
  cancelled?: boolean
}

const TEST_APARTMENT_SLUG = "__sync_check__"

let currentEvents: Event[] = []

function toIcsDate(value: string) {
  return value.replace(/-/g, "")
}

function buildIcs(events: Event[]) {
  const body = events
    .map((event) =>
      [
        "BEGIN:VEVENT",
        `UID:${event.uid}`,
        `DTSTART;VALUE=DATE:${toIcsDate(event.start)}`,
        `DTEND;VALUE=DATE:${toIcsDate(event.end)}`,
        `SUMMARY:${event.summary}`,
        event.cancelled ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
        "END:VEVENT"
      ].join("\r\n")
    )
    .join("\r\n")

  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//test//EN", body, "END:VCALENDAR"].join("\r\n")
}

async function main() {
  const server = http.createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "text/calendar" })
    response.end(buildIcs(currentEvents))
  })
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const port = (server.address() as { port: number }).port
  const feedUrl = `http://127.0.0.1:${port}/booking.ics`

  // A throwaway apartment of its own, removed at the end. Running against a
  // real one meant the importer's stale-row handling cancelled whatever else
  // lived there — the demo data, or worse, a genuine booking on a database
  // someone was using.
  const apartment = await prisma.apartment.upsert({
    where: { slug: TEST_APARTMENT_SLUG },
    update: {},
    create: { slug: TEST_APARTMENT_SLUG, name: "Testovací apartmán (sync-check)", isActive: false }
  })

  await prisma.reservation.deleteMany({ where: { apartmentId: apartment.id } })
  await prisma.icalFeed.deleteMany({ where: { apartmentId: apartment.id } })
  const feedRow = await prisma.icalFeed.create({
    data: { apartmentId: apartment.id, provider: "booking", url: feedUrl }
  })
  const feed = { ...feedRow, apartment }

  const A = { uid: "resA@booking.com", start: "2026-08-10", end: "2026-08-14", summary: "CLOSED - Not available" }
  const B = { uid: "resB@booking.com", start: "2026-08-20", end: "2026-08-23", summary: "CLOSED - Not available" }

  console.log("\n1. První sync — dvě rezervace z feedu")
  currentEvents = [A, B]
  let result = await importIcalFeed(feed)
  check("created", result.created, 2)
  check("updated", result.updated, 0)
  check("cancelled", result.cancelled, 0)

  console.log("\n2. Druhý sync beze změny — nesmí nic zapsat")
  result = await importIcalFeed(feed)
  check("created", result.created, 0)
  check("updated", result.updated, 0)
  check("cancelled", result.cancelled, 0)

  console.log("\n3. Ruční doplnění jména, kontaktu, ceny a osob → sync je nesmí přepsat")
  const rowA = await prisma.reservation.findFirstOrThrow({ where: { externalUid: A.uid } })
  await prisma.reservation.update({
    where: { id: rowA.id },
    data: {
      name: "Jan Novák",
      email: "novak@example.cz",
      phone: "+420777123456",
      adults: 2,
      children: 1,
      hasDog: true,
      dogsCount: 1,
      priceCents: 840000,
      note: "Přijedou večer kolem 20:00",
      manualEditedAt: new Date()
    }
  })

  await importIcalFeed(feed)
  const afterSync = await prisma.reservation.findUniqueOrThrow({ where: { id: rowA.id } })
  check("jméno", afterSync.name, "Jan Novák")
  check("email", afterSync.email, "novak@example.cz")
  check("telefon", afterSync.phone, "+420777123456")
  check("dospělí", afterSync.adults, 2)
  check("děti", afterSync.children, 1)
  check("pes", afterSync.hasDog, true)
  check("cena (haléře)", afterSync.priceCents, 840000)
  check("poznámka", afterSync.note, "Přijedou večer kolem 20:00")

  console.log("\n4. Booking posune termín → aktualizují se jen datumy")
  currentEvents = [{ ...A, start: "2026-08-11", end: "2026-08-15" }, B]
  result = await importIcalFeed(feed)
  check("updated", result.updated, 1)
  const moved = await prisma.reservation.findUniqueOrThrow({ where: { id: rowA.id } })
  check("nový příjezd", moved.startDate, "2026-08-11")
  check("nový odjezd", moved.endDate, "2026-08-15")
  check("jméno přežilo posun", moved.name, "Jan Novák")
  check("cena přežila posun", moved.priceCents, 840000)

  console.log("\n5. Rezervace zmizí z feedu → storno, ne smazání")
  currentEvents = [B]
  result = await importIcalFeed(feed)
  check("cancelled", result.cancelled, 1)
  const cancelled = await prisma.reservation.findUnique({ where: { id: rowA.id } })
  check("řádek stále existuje", cancelled !== null, true)
  check("stav", cancelled?.status, "cancelled")
  check("důvod", cancelled?.cancelReason, "ical_disappeared")
  check("cancelledAt vyplněno", cancelled?.cancelledAt !== null, true)
  check("kontakt zachován pro statistiky", cancelled?.name, "Jan Novák")

  console.log("\n6. Opakovaný sync nad zrušenou → už ji znovu neruší")
  result = await importIcalFeed(feed)
  check("cancelled", result.cancelled, 0)

  console.log("\n7. Rezervace se vrátí do feedu → reaktivace, ne duplicita")
  currentEvents = [{ ...A, start: "2026-08-11", end: "2026-08-15" }, B]
  result = await importIcalFeed(feed)
  check("updated", result.updated, 1)
  check("created (žádná duplicita)", result.created, 0)
  const revived = await prisma.reservation.findUniqueOrThrow({ where: { id: rowA.id } })
  check("stav", revived.status, "confirmed")
  check("cancelledAt vynulováno", revived.cancelledAt, null)
  check("cancelReason vynulováno", revived.cancelReason, null)
  check("jméno stále tam", revived.name, "Jan Novák")

  const total = await prisma.reservation.count({ where: { apartmentId: apartment.id, source: "booking" } })
  check("celkem řádků z feedu", total, 2)

  console.log("\n8. STATUS:CANCELLED ve feedu → storno")
  currentEvents = [{ ...A, start: "2026-08-11", end: "2026-08-15" }, { ...B, cancelled: true }]
  result = await importIcalFeed(feed)
  check("cancelled", result.cancelled, 1)
  const rowB = await prisma.reservation.findFirstOrThrow({ where: { externalUid: B.uid } })
  check("stav", rowB.status, "cancelled")
  check("důvod", rowB.cancelReason, "ical_cancelled")

  // The two outputs the world actually sees: the public availability feed the
  // booking calendar reads, and the .ics Booking/Airbnb subscribe to. Both
  // filter on status, so the confirmed/inquiry rename had to leave them
  // returning the same nights as before.
  console.log("\n9. Veřejné výstupy — obsazenost a iCal export")
  await prisma.reservation.deleteMany({ where: { apartmentId: apartment.id } })
  await prisma.reservation.createMany({
    data: [
      { apartmentId: apartment.id, source: "booking", externalUid: "pub-conf", startDate: "2029-09-01", endDate: "2029-09-05", status: "confirmed", adults: 2 },
      { apartmentId: apartment.id, source: "booking", externalUid: "pub-inq", startDate: "2029-09-10", endDate: "2029-09-12", status: "inquiry", adults: 2 },
      { apartmentId: apartment.id, source: "booking", externalUid: "pub-canc", startDate: "2029-09-20", endDate: "2029-09-22", status: "cancelled", adults: 2 },
      { apartmentId: apartment.id, source: "booking", externalUid: "pub-nosh", startDate: "2029-09-25", endDate: "2029-09-27", status: "no_show", adults: 2 }
    ]
  })

  const busy = (await listReservationsForApartment(apartment.id))
    .filter((reservation) => isBlocking(reservation.status) && reservation.startDate.startsWith("2029-"))
    .map((reservation) => `${reservation.startDate}..${reservation.endDate}`)
    .sort()
  check("obsazeno = potvrzené + poptávky", busy, ["2029-09-01..2029-09-05", "2029-09-10..2029-09-12"])

  const ics = (await buildApartmentIcal(apartment)).toString()
  const eventCount2029 = (ics.match(/DTSTART[^:]*:2029\d{4}/g) || []).length
  check("iCal export: počet událostí", eventCount2029, 2)
  check("iCal export neobsahuje zrušenou", ics.includes("20290920"), false)
  check("iCal export neobsahuje nedorazil", ics.includes("20290925"), false)
  check("iCal export neprozrazuje jméno hosta", /SUMMARY:Obsazeno/.test(ics), true)

  // Tidy up so the dev database isn't left with the test apartment.
  await prisma.reservation.deleteMany({ where: { apartmentId: apartment.id } })
  await prisma.icalFeed.deleteMany({ where: { apartmentId: apartment.id } })
  await prisma.apartment.delete({ where: { id: apartment.id } })
  server.close()

  console.log(`\n${failures === 0 ? "VŠE PROŠLO" : "SELHALO"} — ${checks - failures}/${checks} kontrol`)
  await prisma.$disconnect()
  process.exit(failures === 0 ? 0 : 1)
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
