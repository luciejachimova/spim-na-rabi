import type { Metadata } from "next"
import Link from "next/link"
import ReservationList from "@/components/manager/reservation-list"
import { formatDateForPrague } from "@/lib/prague-date"
import { listApartmentFilters } from "@/lib/reservations/manager-data"
import { listAllReservations } from "@/lib/reservations/queries"

export const metadata: Metadata = { title: "Rezervace | Spim Manager" }

// Read straight from the database on every request. Prisma queries are
// invisible to Next's data cache, so without this the page is prerendered at
// build time and would keep serving that snapshot — including through the
// iCal sync that rewrites reservations every 15 minutes.
export const dynamic = "force-dynamic"

export default async function ReservationsPage() {
  const [reservations, apartments] = await Promise.all([listAllReservations(), listApartmentFilters()])

  // Newest first: the list opens on "Nadcházející", where the next arrival
  // matters more than one in six months.
  const sorted = [...reservations].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl">Rezervace</h1>
        <Link
          href="/manager/rezervace/nova"
          className="hidden cursor-pointer rounded-[2px] border border-dark/20 px-3 py-2 text-xs uppercase tracking-wide text-muted transition-colors hover:border-dark hover:text-dark md:block"
        >
          Nová
        </Link>
      </div>

      <ReservationList reservations={sorted} apartments={apartments} today={formatDateForPrague(new Date())} />
    </div>
  )
}
