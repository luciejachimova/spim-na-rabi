import type { Metadata } from "next"
import GuestList from "@/components/manager/guest-list"
import { listGuestsWithStats } from "@/lib/reservations/guests"

export const metadata: Metadata = { title: "Hosté | Spim Manager" }

// Read straight from the database on every request. Prisma queries are
// invisible to Next's data cache, so without this the page is prerendered at
// build time and would keep serving that snapshot — including through the
// iCal sync that rewrites reservations every 15 minutes.
export const dynamic = "force-dynamic"

export default async function GuestsPage() {
  const guests = await listGuestsWithStats()

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-2xl">Hosté</h1>
      <GuestList guests={guests} />
    </div>
  )
}
