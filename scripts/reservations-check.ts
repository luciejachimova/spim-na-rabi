// Behavioural check for the reservation domain layer.
//
// The atomic insert and update are hand-written SQL with 27 columns each —
// exactly the kind of code where a misaligned column list is silent until a
// price lands in the deposit field. This drives them end to end.
//
// Run against the LOCAL sqlite file only:
//   npm run check:reservations

import { prisma } from "@/lib/db"
import { findConflicts, listBlockedRanges } from "@/lib/reservations/availability"
import { createManualReservation } from "@/lib/reservations/create"
import { ReservationConflictError } from "@/lib/reservations/errors"
import { getGuestDetail, listGuestsWithStats, normalizePhone } from "@/lib/reservations/guests"
import { cancelReservation } from "@/lib/reservations/cancel"
import { updateReservation } from "@/lib/reservations/update"

let failures = 0
let checks = 0

function check(label: string, actual: unknown, expected: unknown) {
  checks += 1
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(
    `${ok ? "  ok  " : "  FAIL"}  ${label}${ok ? "" : `\n          čekáno: ${JSON.stringify(expected)}\n          reálně: ${JSON.stringify(actual)}`}`
  )
}

const TEST_GUEST_NAMES = ["Jan Novák", "Marie Svobodová", "Poptávka Loft", "Náhradník", "Kolize"]

// Matched by name, not e-mail: a guest created without contact details has a
// null emailNorm, so deleting by e-mail alone leaves it behind and the next
// run then trips over data from the previous one.
async function clearTestGuests() {
  await prisma.guest.deleteMany({ where: { name: { in: TEST_GUEST_NAMES } } })
}

async function main() {
  const studio = await prisma.apartment.findUniqueOrThrow({ where: { slug: "studio-3" } })
  const loft = await prisma.apartment.findUniqueOrThrow({ where: { slug: "loft-10" } })

  // Isolated date window so this can run repeatedly on a dev database.
  await prisma.reservation.deleteMany({ where: { startDate: { gte: "2027-01-01", lt: "2027-02-01" } } })
  await clearTestGuests()

  console.log("\n1. Vytvoření rezervace přes manager — všechna pole projdou správně")
  const created = await createManualReservation({
    apartmentId: studio.id,
    startDate: "2027-01-10",
    endDate: "2027-01-14",
    source: "phone",
    status: "confirmed",
    name: "Jan Novák",
    email: "Novak@Example.cz ",
    phone: "777 123 456",
    adults: 2,
    children: 1,
    childrenAges: "7",
    hasDog: true,
    dogsCount: 1,
    priceCents: 840000,
    depositCents: 200000,
    isPaid: false,
    note: "Interní poznámka",
    guestNote: "Přijedeme kolem 20:00",
    arrivalTime: "20:00"
  })

  check("apartmán", created.apartmentId, studio.id)
  check("příjezd", created.startDate, "2027-01-10")
  check("odjezd", created.endDate, "2027-01-14")
  check("zdroj", created.source, "phone")
  check("stav", created.status, "confirmed")
  check("dospělí", created.adults, 2)
  check("děti", created.children, 1)
  check("věk dětí", created.childrenAges, "7")
  check("pes", created.hasDog, true)
  check("počet psů", created.dogsCount, 1)
  check("cena v haléřích", created.priceCents, 840000)
  check("záloha", created.depositCents, 200000)
  check("zaplaceno", created.isPaid, false)
  check("měna", created.currency, "CZK")
  check("interní poznámka", created.note, "Interní poznámka")
  check("poznámka hosta", created.guestNote, "Přijedeme kolem 20:00")
  check("čas příjezdu", created.arrivalTime, "20:00")
  check("legacy guests = dospělí + děti", created.guests, 3)

  console.log("\n2. Host se propsal do adresáře, e-mail normalizovaný")
  const withGuest = await prisma.reservation.findUniqueOrThrow({ where: { id: created.id } })
  check("rezervace má guestId", withGuest.guestId !== null, true)
  const guest = await getGuestDetail(withGuest.guestId!)
  check("jméno hosta", guest?.name, "Jan Novák")
  check("e-mail zachován jak zadán", guest?.email, "Novak@Example.cz")
  const guestRow = await prisma.guest.findUniqueOrThrow({ where: { id: withGuest.guestId! } })
  check("emailNorm", guestRow.emailNorm, "novak@example.cz")
  check("phoneNorm doplní předvolbu", guestRow.phoneNorm, "+420777123456")
  check("normalizace telefonu samostatně", normalizePhone("+420 777 123 456"), "+420777123456")

  console.log("\n3. Kolize — stejný apartmán, překryv termínu")
  let conflictThrown = false
  try {
    await createManualReservation({
      apartmentId: studio.id,
      startDate: "2027-01-12",
      endDate: "2027-01-16",
      source: "phone",
      status: "confirmed",
      name: "Kolize",
      adults: 1,
      children: 0,
      hasDog: false,
      dogsCount: 0
    })
  } catch (error) {
    conflictThrown = error instanceof ReservationConflictError
  }
  check("odmítnuto jako kolize", conflictThrown, true)

  console.log("\n4. Odjezd a příjezd v tentýž den kolize NENÍ")
  const sameDay = await createManualReservation({
    apartmentId: studio.id,
    startDate: "2027-01-14",
    endDate: "2027-01-17",
    source: "phone",
    status: "confirmed",
    name: "Marie Svobodová",
    email: "svobodova@example.cz",
    adults: 2,
    children: 0,
    hasDog: false,
    dogsCount: 0,
    priceCents: 630000
  })
  check("vytvořeno", sameDay.startDate, "2027-01-14")

  console.log("\n5. Druhý apartmán ve stejném termínu je volný")
  const otherApartment = await createManualReservation({
    apartmentId: loft.id,
    startDate: "2027-01-10",
    endDate: "2027-01-14",
    source: "email",
    status: "inquiry",
    name: "Poptávka Loft",
    adults: 4,
    children: 0,
    hasDog: false,
    dogsCount: 0
  })
  check("vytvořeno v Loftu", otherApartment.apartmentId, loft.id)
  check("stav poptávka", otherApartment.status, "inquiry")

  console.log("\n6. Klientská detekce kolizí odpovídá databázi")
  const ranges = await listBlockedRanges({ fromDate: "2027-01-01" })
  check("poptávka blokuje (je v seznamu)", ranges.some((range) => range.id === otherApartment.id), true)
  check(
    "překryv nalezen",
    findConflicts(ranges, { apartmentId: studio.id, startDate: "2027-01-12", endDate: "2027-01-13" }).length,
    1
  )
  check(
    "tentýž den odjezd/příjezd = bez kolize",
    findConflicts(ranges, { apartmentId: studio.id, startDate: "2027-01-17", endDate: "2027-01-19" }).length,
    0
  )
  check(
    "vlastní rezervace se při editaci nepočítá",
    findConflicts(ranges, {
      apartmentId: studio.id,
      startDate: "2027-01-10",
      endDate: "2027-01-14",
      excludeReservationId: created.id
    }).length,
    0
  )

  console.log("\n7. Editace — částečný vstup nesmí smazat ostatní pole")
  const edited = await updateReservation(created.id, {
    apartmentId: studio.id,
    startDate: "2027-01-09",
    endDate: "2027-01-14",
    name: "Jan Novák",
    isPaid: true
  })
  check("nový příjezd", edited.startDate, "2027-01-09")
  check("cena zachována", edited.priceCents, 840000)
  check("pes zachován", edited.hasDog, true)
  check("děti zachovány", edited.children, 1)
  check("poznámka hosta zachována", edited.guestNote, "Přijedeme kolem 20:00")
  check("zaplaceno změněno", edited.isPaid, true)
  check("manualEditedAt vyplněno", edited.manualEditedAt !== null, true)
  // Regression: a partial edit used to blank these and then relink the
  // reservation to a freshly created, contactless duplicate of the guest.
  check("e-mail nezmizel", edited.email, "Novak@Example.cz")
  check("telefon nezmizel", edited.phone, "777 123 456")
  check("interní poznámka nezmizela", edited.note, "Interní poznámka")
  const stillSameGuest = await prisma.reservation.findUniqueOrThrow({ where: { id: created.id } })
  check("host zůstal stejný", stillSameGuest.guestId, withGuest.guestId)
  check("nevznikl duplikát hosta", await prisma.guest.count({ where: { name: "Jan Novák" } }), 1)

  console.log("\n8. Storno přes formulář zapíše stejnou stopu jako cancelReservation")
  const cancelledViaForm = await updateReservation(otherApartment.id, {
    apartmentId: loft.id,
    startDate: otherApartment.startDate,
    endDate: otherApartment.endDate,
    status: "cancelled",
    cancelReason: "host zrušil telefonicky"
  })
  check("stav", cancelledViaForm.status, "cancelled")
  check("cancelledAt vyplněno", cancelledViaForm.cancelledAt !== null, true)
  check("důvod", cancelledViaForm.cancelReason, "host zrušil telefonicky")

  console.log("\n9. Zrušený termín se uvolní pro novou rezervaci")
  const reuse = await createManualReservation({
    apartmentId: loft.id,
    startDate: "2027-01-11",
    endDate: "2027-01-13",
    source: "website",
    status: "confirmed",
    name: "Náhradník",
    adults: 2,
    children: 0,
    hasDog: false,
    dogsCount: 0
  })
  check("vytvořeno na uvolněném termínu", reuse.status, "confirmed")

  console.log("\n10. Adresář hostů — statistiky")
  const guests = await listGuestsWithStats()
  const novak = guests.find((entry) => entry.email === "Novak@Example.cz")
  check("Novák v adresáři", novak !== undefined, true)
  check("počet pobytů", novak?.stayCount, 1)
  check("počet nocí (9.–14. 1.)", novak?.nightCount, 5)
  check("útrata v haléřích", novak?.totalCents, 840000)
  check("vracející se host", novak?.isReturning, false)

  console.log("\n11. Storno se do útraty ani do počtu pobytů nepočítá")
  await cancelReservation(sameDay.id, "test")
  const guestsAfter = await listGuestsWithStats()
  const svobodova = guestsAfter.find((entry) => entry.email === "svobodova@example.cz")
  check("pobyty po stornu", svobodova?.stayCount, 0)
  check("útrata po stornu", svobodova?.totalCents, 0)

  // Tidy up.
  await prisma.reservation.deleteMany({ where: { startDate: { gte: "2027-01-01", lt: "2027-02-01" } } })
  await clearTestGuests()

  console.log(`\n${failures === 0 ? "VŠE PROŠLO" : "SELHALO"} — ${checks - failures}/${checks} kontrol`)
  await prisma.$disconnect()
  process.exit(failures === 0 ? 0 : 1)
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
