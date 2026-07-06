import { listAllReservations, listApartments } from "@/lib/reservations"
import AdminReservations from "@/components/admin-reservations"

export const dynamic = "force-dynamic"

export default async function AdminReservationsPage() {
  const [reservations, apartments] = await Promise.all([listAllReservations(), listApartments()])

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <h1 className="font-serif text-3xl">Rezervace</h1>
      <AdminReservations reservations={reservations} apartments={apartments} />
    </div>
  )
}
