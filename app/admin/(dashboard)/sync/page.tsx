import { listApartmentsWithFeeds } from "@/lib/reservations"
import AdminSync from "@/components/admin-sync"

export const dynamic = "force-dynamic"

export default async function AdminSyncPage() {
  const apartments = await listApartmentsWithFeeds()

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="font-serif text-3xl">Kalendáře</h1>
      <AdminSync apartments={apartments} />
    </div>
  )
}
