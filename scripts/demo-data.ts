// Fills the LOCAL development database with a plausible season so the manager
// screens can be reviewed with real-looking content. Never touches production —
// lib/db-target.ts refuses a remote database from here.
//
//   npm run db:demo
//
// Re-running replaces the demo rows rather than piling up duplicates.

import { prisma } from "@/lib/db"
import { createManualReservation } from "@/lib/reservations/create"
import { addDaysToKey, formatDateForPrague } from "@/lib/prague-date"
import type { ManualReservationInput } from "@/lib/reservations/types"

const DEMO_NOTE_MARKER = "[demo]"

async function main() {
  const studio = await prisma.apartment.findUniqueOrThrow({ where: { slug: "studio-3" } })
  const loft = await prisma.apartment.findUniqueOrThrow({ where: { slug: "loft-10" } })

  const removed = await prisma.reservation.deleteMany({ where: { note: { contains: DEMO_NOTE_MARKER } } })
  await prisma.guest.deleteMany({ where: { note: { contains: DEMO_NOTE_MARKER } } })
  if (removed.count > 0) console.log(`Odstraněno ${removed.count} starých ukázkových rezervací.`)

  const today = formatDateForPrague(new Date())
  const day = (offset: number) => addDaysToKey(today, offset)

  const demo: ManualReservationInput[] = [
    {
      apartmentId: studio.id,
      startDate: day(-9),
      endDate: day(-5),
      source: "booking",
      status: "confirmed",
      name: "Petra Dvořáková",
      email: "dvorakova@example.cz",
      phone: "602 118 244",
      adults: 2,
      children: 0,
      hasDog: false,
      dogsCount: 0,
      priceCents: 512000,
      isPaid: true,
      note: `${DEMO_NOTE_MARKER} proběhlý pobyt`
    },
    {
      // Currently staying — the list's "Probíhající" filter needs one.
      apartmentId: loft.id,
      startDate: day(-2),
      endDate: day(3),
      source: "airbnb",
      status: "confirmed",
      name: "Familie Berger",
      email: "berger@example.de",
      phone: "+49 170 2233445",
      adults: 2,
      children: 2,
      childrenAges: "4, 9",
      hasDog: false,
      dogsCount: 0,
      priceCents: 1180000,
      isPaid: true,
      note: `${DEMO_NOTE_MARKER} právě ubytovaní`
    },
    {
      apartmentId: studio.id,
      startDate: day(3),
      endDate: day(6),
      source: "phone",
      status: "confirmed",
      name: "Jan Novák",
      email: "novak@example.cz",
      phone: "777 123 456",
      adults: 2,
      children: 1,
      childrenAges: "7",
      hasDog: true,
      dogsCount: 1,
      priceCents: 840000,
      depositCents: 200000,
      isPaid: false,
      arrivalTime: "20:00",
      guestNote: "Přijedeme až večer, prosíme o klíč v trezorku.",
      note: `${DEMO_NOTE_MARKER} pes, doplatek na místě`
    },
    {
      // Same-day turnover after the Novák stay — the case the cleaning module
      // in phase 2 cares about most.
      apartmentId: studio.id,
      startDate: day(6),
      endDate: day(9),
      source: "website",
      status: "confirmed",
      name: "Tomáš Král",
      email: "kral@example.cz",
      phone: "605 900 121",
      adults: 2,
      children: 0,
      hasDog: false,
      dogsCount: 0,
      priceCents: 630000,
      isPaid: true,
      note: `${DEMO_NOTE_MARKER} navazuje na předchozí odjezd`
    },
    {
      apartmentId: loft.id,
      startDate: day(12),
      endDate: day(19),
      source: "email",
      status: "inquiry",
      name: "Eva Horáková",
      email: "horakova@example.cz",
      phone: "724 556 890",
      adults: 4,
      children: 2,
      childrenAges: "2, 5",
      hasDog: true,
      dogsCount: 2,
      priceCents: 1960000,
      isPaid: false,
      note: `${DEMO_NOTE_MARKER} nezávazná poptávka, drží termín`
    },
    {
      apartmentId: loft.id,
      startDate: day(24),
      endDate: day(27),
      source: "admin_block",
      status: "confirmed",
      adults: 0,
      children: 0,
      hasDog: false,
      dogsCount: 0,
      note: `${DEMO_NOTE_MARKER} malování ložnice`
    },
    {
      // A returning guest, so the address book shows the "Vrací se" badge.
      apartmentId: studio.id,
      startDate: day(40),
      endDate: day(44),
      source: "phone",
      status: "confirmed",
      name: "Jan Novák",
      email: "novak@example.cz",
      phone: "777 123 456",
      adults: 2,
      children: 1,
      hasDog: true,
      dogsCount: 1,
      priceCents: 880000,
      isPaid: false,
      note: `${DEMO_NOTE_MARKER} opakovaná návštěva`
    }
  ]

  for (const input of demo) {
    const reservation = await createManualReservation(input)
    console.log(`  + ${reservation.startDate} → ${reservation.endDate}  ${reservation.apartmentName}  ${reservation.name ?? "blokace"}`)
  }

  // One imported reservation with no contact and no price, the way Booking
  // actually delivers them — the detail screen has a prompt for exactly this.
  await prisma.reservation.create({
    data: {
      apartmentId: loft.id,
      startDate: day(31),
      endDate: day(35),
      source: "booking",
      status: "confirmed",
      externalUid: "demo-booking-uid",
      name: "CLOSED - Not available",
      adults: 0,
      children: 0,
      lastSyncedAt: new Date(),
      note: `${DEMO_NOTE_MARKER} import bez kontaktu a ceny`
    }
  })
  console.log("  + import z Booking.com bez kontaktu")

  console.log(`\nHotovo. Ukázková data odstraníte opakovaným spuštěním nebo smazáním rezervací s poznámkou "${DEMO_NOTE_MARKER}".`)
  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
