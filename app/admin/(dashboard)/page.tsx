import { getDashboardStats } from "@/lib/reservations"
import AdminDashboard from "@/components/admin-dashboard"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const stats = await getDashboardStats()

  return <AdminDashboard stats={stats} />
}
