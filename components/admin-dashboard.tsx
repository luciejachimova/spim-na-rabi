import type { DashboardStats, HousekeepingSchedule } from "@/lib/reservations"
import AdminHousekeeping from "./admin-housekeeping"

const STATUS_LABELS: Record<DashboardStats["systemStatus"], { label: string; className: string }> = {
  ok: { label: "Vše funguje", className: "bg-green-600" },
  warning: { label: "Čeká synchronizace", className: "bg-orange-500" },
  error: { label: "Chyba synchronizace", className: "bg-red-600" }
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[2px] border border-mid/20 bg-pale/40 p-5">
      <p className="text-xs uppercase tracking-wide text-mid">{label}</p>
      <p className="mt-2 font-serif text-3xl text-dark">{value}</p>
    </div>
  )
}

interface Props {
  stats: DashboardStats
  housekeeping: HousekeepingSchedule
}

export default function AdminDashboard({ stats, housekeeping }: Props) {
  const status = STATUS_LABELS[stats.systemStatus]

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <h1 className="font-serif text-3xl">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Počet rezervací" value={stats.totalReservations} />
        <StatCard label="Počet budoucích pobytů" value={stats.futureStays} />
        <StatCard label="Obsazenost tohoto měsíce" value={`${stats.occupancyThisMonth} %`} />
        <StatCard label="Obsazenost příštího měsíce" value={`${stats.occupancyNextMonth} %`} />
        <StatCard label="Příjezdy dnes" value={stats.checkInsToday} />
        <StatCard label="Odjezdy dnes" value={stats.checkOutsToday} />
        <StatCard
          label="Poslední synchronizace"
          value={stats.lastSyncedAt ? new Date(stats.lastSyncedAt).toLocaleString("cs-CZ") : "Nikdy"}
        />
        <div className="rounded-[2px] border border-mid/20 bg-pale/40 p-5">
          <p className="text-xs uppercase tracking-wide text-mid">Poslední chyba</p>
          <p className="mt-2 break-words text-sm text-dark">{stats.lastSyncError || "Žádná"}</p>
        </div>
        <div className="rounded-[2px] border border-mid/20 bg-pale/40 p-5">
          <p className="text-xs uppercase tracking-wide text-mid">Stav systému</p>
          <p className="mt-2 flex items-center gap-2 font-serif text-xl text-dark">
            <span className={`inline-block h-3 w-3 shrink-0 rounded-full ${status.className}`} />
            {status.label}
          </p>
        </div>
      </div>

      <AdminHousekeeping schedule={housekeeping} />
    </div>
  )
}
