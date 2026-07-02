import { listAllReservations, listApartmentsWithFeeds } from "@/lib/reservations"
import AdminDashboard from "@/components/admin-dashboard"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const [reservations, apartments] = await Promise.all([listAllReservations(), listApartmentsWithFeeds()])

  return <AdminDashboard reservations={reservations} apartments={apartments} />
}
