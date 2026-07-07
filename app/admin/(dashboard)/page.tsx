import { getDashboardStats, getHousekeepingSchedule } from "@/lib/reservations"
import AdminDashboard from "@/components/admin-dashboard"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const [stats, housekeeping] = await Promise.all([getDashboardStats(), getHousekeepingSchedule()])

  return <AdminDashboard stats={stats} housekeeping={housekeeping} />
}
