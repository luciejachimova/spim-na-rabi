import Link from "next/link"
import { listApartmentsWithFeeds } from "@/lib/reservations"
import AdminSync from "@/components/admin-sync"

export const dynamic = "force-dynamic"

export default async function AdminSyncPage() {
  const apartments = await listApartmentsWithFeeds()

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 font-jost text-dark">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Synchronizace kalendářů</h1>
        <Link href="/admin" className="text-sm text-mid underline hover:text-dark">
          ← Zpět na přehled
        </Link>
      </div>

      <AdminSync apartments={apartments} />
    </div>
  )
}
