import { getSyncSystemStatus, listAllReservations, listApartmentsWithFeeds } from "@/lib/reservations"
import AdminCalendar from "@/components/admin-calendar"
import AdminSystemStatus from "@/components/admin-system-status"
import AdminSync from "@/components/admin-sync"

export const dynamic = "force-dynamic"

export default async function AdminSyncPage() {
  const [apartments, reservations, systemStatus] = await Promise.all([
    listApartmentsWithFeeds(),
    listAllReservations(),
    getSyncSystemStatus()
  ])

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <h1 className="font-serif text-3xl">Kalendáře</h1>
      <AdminCalendar apartments={apartments} reservations={reservations} />
      <AdminSystemStatus status={systemStatus} />
      <AdminSync apartments={apartments} />
    </div>
  )
}
