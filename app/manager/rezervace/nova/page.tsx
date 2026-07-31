import type { Metadata } from "next"
import Link from "next/link"
import { createReservationAction } from "@/app/manager/actions"
import ReservationForm from "@/components/manager/reservation-form"
import { formatDateForPrague } from "@/lib/prague-date"
import { listBlockedRanges } from "@/lib/reservations/availability"
import { listApartmentOptions } from "@/lib/reservations/manager-data"

export const metadata: Metadata = { title: "Nová rezervace | Spim Manager" }

// Read straight from the database on every request. Prisma queries are
// invisible to Next's data cache, so without this the page is prerendered at
// build time and would keep serving that snapshot — including through the
// iCal sync that rewrites reservations every 15 minutes.
export const dynamic = "force-dynamic"

export default async function NewReservationPage() {
  const [apartments, blockedRanges] = await Promise.all([
    listApartmentOptions(),
    // Only from today: past stays can't clash with anything being entered now,
    // and the list is shipped to the browser for the live conflict check.
    listBlockedRanges({ fromDate: formatDateForPrague(new Date()) })
  ])

  return (
    <div className="space-y-5">
      <div className="mx-auto max-w-xl">
        <Link href="/manager/rezervace" className="text-sm text-muted underline hover:text-dark">
          ← Zpět na rezervace
        </Link>
        <h1 className="mt-2 font-serif text-2xl">Nová rezervace</h1>
      </div>

      <ReservationForm
        apartments={apartments}
        blockedRanges={blockedRanges}
        action={createReservationAction}
        submitLabel="Vytvořit rezervaci"
      />
    </div>
  )
}
