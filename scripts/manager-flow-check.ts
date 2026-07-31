// End-to-end check of the manager's server actions.
//
// The domain layer has its own coverage (check:reservations). This drives the
// layer above it — the one that parses FormData, converts crowns to haléře and
// decides what the owner sees when something goes wrong. Server actions are
// plain async functions, so they can be called directly.
//
//   npm run check:flow

import { createReservationAction, cancelReservationAction, updateReservationAction } from "@/app/manager/actions"
import { prisma } from "@/lib/db"
import { EMPTY_FORM_STATE } from "@/app/manager/form-state"
import { listBlockedRanges } from "@/lib/reservations/availability"
import { findConflicts } from "@/lib/reservations/overlap"

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

function isRedirect(error: unknown) {
  return typeof (error as { digest?: string })?.digest === "string" && (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
}

function redirectTarget(error: unknown) {
  // digest looks like NEXT_REDIRECT;replace;/manager/rezervace/12;307;
  return String((error as { digest: string }).digest).split(";")[2]
}

interface ActionOutcome {
  redirectedTo: string | null
  error: string | null
}

// A successful action ends by throwing NEXT_REDIRECT; a rejected one returns a
// message for the form. revalidatePath needs a request context that a plain
// script doesn't have, so its failure is treated as "got that far".
async function run(
  action: (state: typeof EMPTY_FORM_STATE, formData: FormData) => Promise<{ error?: string }>,
  fields: Record<string, string>
): Promise<ActionOutcome> {
  const formData = new FormData()
  for (const [key, value] of Object.entries(fields)) formData.set(key, value)

  try {
    const state = await action(EMPTY_FORM_STATE, formData)
    return { redirectedTo: null, error: state.error ?? null }
  } catch (error) {
    if (isRedirect(error)) return { redirectedTo: redirectTarget(error), error: null }
    if (error instanceof Error && /static generation store|revalidatePath|request scope/i.test(error.message)) {
      return { redirectedTo: "(revalidate mimo request)", error: null }
    }
    throw error
  }
}

const WINDOW_START = "2028-03-01"

async function main() {
  const studio = await prisma.apartment.findUniqueOrThrow({ where: { slug: "studio-3" } })
  const loft = await prisma.apartment.findUniqueOrThrow({ where: { slug: "loft-10" } })

  await prisma.reservation.deleteMany({ where: { startDate: { gte: WINDOW_START, lt: "2028-05-01" } } })
  await prisma.guest.deleteMany({ where: { emailNorm: "flow@example.cz" } })

  const base = {
    apartmentId: String(studio.id),
    source: "phone",
    status: "confirmed",
    name: "Flow Test",
    email: "flow@example.cz",
    phone: "608 111 222",
    adults: "2",
    children: "1",
    childrenAges: "6",
    dogsCount: "1",
    price: "8 400",
    deposit: "2000",
    note: "flow"
  }

  console.log("\n1. Vytvoření nové rezervace celým tokem")
  const created = await run(createReservationAction, {
    ...base,
    startDate: "2028-03-10",
    endDate: "2028-03-14",
    hasDog: "on",
    isPaid: "on"
  })
  check("bez chyby", created.error, null)
  // Only that the action ran to its terminal step. Which path it redirects to
  // can't be observed here: revalidatePath needs a request context a plain
  // script doesn't have, so it throws before redirect() is reached. The
  // redirect itself is covered by opening the app.
  check("akce doběhla až k přesměrování", created.redirectedTo !== null, true)

  const reservation = await prisma.reservation.findFirstOrThrow({ where: { startDate: "2028-03-10" } })
  check("cena '8 400' → haléře", reservation.priceCents, 840000)
  check("záloha", reservation.depositCents, 200000)
  check("zaplaceno z checkboxu", reservation.isPaid, true)
  check("pes z checkboxu", reservation.hasDog, true)
  check("počet psů", reservation.dogsCount, 1)
  check("dospělí", reservation.adults, 2)
  check("děti", reservation.children, 1)
  check("host propojen", reservation.guestId !== null, true)

  console.log("\n2. Editace rezervace")
  const edited = await run(updateReservationAction, {
    ...base,
    reservationId: String(reservation.id),
    startDate: "2028-03-10",
    endDate: "2028-03-14",
    price: "9000",
    note: "flow upraveno"
    // hasDog i isPaid vynechány = odškrtnuté checkboxy
  })
  check("bez chyby", edited.error, null)
  const afterEdit = await prisma.reservation.findUniqueOrThrow({ where: { id: reservation.id } })
  check("cena změněna", afterEdit.priceCents, 900000)
  check("poznámka změněna", afterEdit.note, "flow upraveno")
  check("odškrtnutý pes se propíše", afterEdit.hasDog, false)
  check("odškrtnuté zaplaceno se propíše", afterEdit.isPaid, false)
  check("kontakt zachován", afterEdit.email, "flow@example.cz")

  console.log("\n3. Zrušení rezervace")
  const cancelForm = new FormData()
  cancelForm.set("reservationId", String(reservation.id))
  cancelForm.set("reason", "test storna")
  await cancelReservationAction(cancelForm).catch((error) => {
    if (!/static generation store|revalidatePath|request scope/i.test(String(error?.message))) throw error
  })
  const cancelled = await prisma.reservation.findUniqueOrThrow({ where: { id: reservation.id } })
  check("stav", cancelled.status, "cancelled")
  check("důvod", cancelled.cancelReason, "test storna")
  check("cancelledAt vyplněno", cancelled.cancelledAt !== null, true)
  check("řádek nezmizel", cancelled.name, "Flow Test")

  console.log("\n4. Přesun rezervace na jiný termín")
  const revived = await run(updateReservationAction, {
    ...base,
    reservationId: String(reservation.id),
    startDate: "2028-03-20",
    endDate: "2028-03-24"
  })
  check("bez chyby", revived.error, null)
  const moved = await prisma.reservation.findUniqueOrThrow({ where: { id: reservation.id } })
  check("nový příjezd", moved.startDate, "2028-03-20")
  check("nový odjezd", moved.endDate, "2028-03-24")
  check("stav zpět na potvrzeno", moved.status, "confirmed")
  check("cancelledAt vynulováno", moved.cancelledAt, null)
  check("důvod storna vynulován", moved.cancelReason, null)

  console.log("\n5. Detekce kolizí")
  const clash = await run(createReservationAction, {
    ...base,
    startDate: "2028-03-22",
    endDate: "2028-03-26",
    name: "Kolizní"
  })
  check("odmítnuto s hláškou pro majitelku", clash.error, "Vybraný termín je už obsazený.")
  check("nic se nevytvořilo", await prisma.reservation.count({ where: { startDate: "2028-03-22" } }), 0)

  const sameDay = await run(createReservationAction, {
    ...base,
    startDate: "2028-03-24",
    endDate: "2028-03-27",
    name: "Navazující"
  })
  check("odjezd a příjezd tentýž den projde", sameDay.error, null)

  const otherFlat = await run(createReservationAction, {
    ...base,
    apartmentId: String(loft.id),
    startDate: "2028-03-20",
    endDate: "2028-03-24",
    name: "Druhý apartmán"
  })
  check("druhý apartmán ve stejném termínu projde", otherFlat.error, null)

  const ranges = await listBlockedRanges({ fromDate: WINDOW_START })
  check(
    "varování ve formuláři odpovídá odmítnutí serverem",
    findConflicts(ranges, { apartmentId: studio.id, startDate: "2028-03-22", endDate: "2028-03-26" }).length > 0,
    true
  )

  console.log("\n6. Rezervace z Bookingu bez kontaktu")
  const imported = await prisma.reservation.create({
    data: {
      apartmentId: loft.id,
      startDate: "2028-04-10",
      endDate: "2028-04-14",
      source: "booking",
      status: "confirmed",
      externalUid: "flow-booking",
      name: "CLOSED - Not available",
      adults: 0,
      children: 0
    }
  })
  check("import bez kontaktu", [imported.phone, imported.email, imported.priceCents], [null, null, null])

  const completed = await run(updateReservationAction, {
    reservationId: String(imported.id),
    apartmentId: String(loft.id),
    startDate: "2028-04-10",
    endDate: "2028-04-14",
    source: "booking",
    status: "confirmed",
    name: "Doplněný Host",
    email: "flow@example.cz",
    phone: "608 111 222",
    adults: "2",
    children: "0",
    dogsCount: "0",
    price: "11 800",
    deposit: "",
    note: "doplněno ručně"
  })
  check("doplnění projde", completed.error, null)
  const filled = await prisma.reservation.findUniqueOrThrow({ where: { id: imported.id } })
  check("jméno doplněno", filled.name, "Doplněný Host")
  check("cena doplněna", filled.priceCents, 1180000)
  check("zdroj zůstal booking", filled.source, "booking")
  check("manualEditedAt označeno pro sync", filled.manualEditedAt !== null, true)
  check("host propojen do adresáře", filled.guestId !== null, true)

  console.log("\n7. Chybné vstupy neprojdou tiše")
  const badPrice = await run(createReservationAction, {
    ...base,
    startDate: "2028-04-20",
    endDate: "2028-04-22",
    price: "8.4OO"
  })
  check("překlep v ceně nahlášen", badPrice.error, "Cena není platné číslo. Zadejte částku v korunách, např. 8400.")
  check("nic se neuložilo", await prisma.reservation.count({ where: { startDate: "2028-04-20" } }), 0)

  const noGuests = await run(createReservationAction, {
    ...base,
    startDate: "2028-04-20",
    endDate: "2028-04-22",
    adults: "0",
    children: "0"
  })
  check("rezervace bez hostů odmítnuta", noGuests.error, "Rezervace musí mít aspoň jednoho hosta.")

  const backwards = await run(createReservationAction, {
    ...base,
    startDate: "2028-04-22",
    endDate: "2028-04-20"
  })
  check("obrácený termín odmítnut", backwards.error, "Odjezd musí být po příjezdu.")

  await prisma.reservation.deleteMany({ where: { startDate: { gte: WINDOW_START, lt: "2028-05-01" } } })
  await prisma.guest.deleteMany({ where: { emailNorm: "flow@example.cz" } })
  await prisma.guest.deleteMany({ where: { name: { in: ["Kolizní", "Navazující", "Druhý apartmán", "Doplněný Host"] } } })

  console.log(`\n${failures === 0 ? "VŠE PROŠLO" : "SELHALO"} — ${checks - failures}/${checks} kontrol`)
  await prisma.$disconnect()
  process.exit(failures === 0 ? 0 : 1)
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
