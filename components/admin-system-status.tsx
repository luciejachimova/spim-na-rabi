import type { SyncSystemStatus, HealthStatus } from "@/lib/reservations"

const STATUS_DOT: Record<HealthStatus, string> = {
  ok: "bg-green-600",
  warning: "bg-orange-500",
  error: "bg-red-600"
}

function formatDateTime(value: string | null) {
  if (!value) return "Nikdy"
  return new Date(value).toLocaleString("cs-CZ")
}

function StatusRow({ label, status, detail }: { label: string; status: HealthStatus; detail?: string | null }) {
  return (
    <tr className="border-b border-light/60">
      <td className="py-2 pr-4">{label}</td>
      <td className="py-2 pr-4">
        <span className="flex items-center gap-2">
          <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
        </span>
      </td>
      <td className="py-2 pr-4 text-mid">{detail || "-"}</td>
    </tr>
  )
}

export default function AdminSystemStatus({ status }: { status: SyncSystemStatus }) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-medium">Stav synchronizace</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-light text-left text-xs uppercase tracking-wide text-mid">
              <th className="py-2 pr-4">Položka</th>
              <th className="py-2 pr-4">Stav</th>
              <th className="py-2 pr-4">Detail</th>
            </tr>
          </thead>
          <tbody>
            <StatusRow
              label="Cron"
              status={status.cron.status}
              detail={`Poslední spuštění: ${formatDateTime(status.cron.lastRun)} · Poslední úspěch: ${formatDateTime(
                status.cron.lastSuccess
              )}${status.cron.lastError ? ` · Chyba: ${status.cron.lastError}` : ""}`}
            />
            <StatusRow label="Booking.com" status={status.booking.status} detail={status.booking.detail} />
            <StatusRow label="Airbnb" status={status.airbnb.status} detail={status.airbnb.detail} />
            <StatusRow label="iCal export" status={status.icalExport.status} detail={status.icalExport.detail} />
            <StatusRow label="Turso" status={status.turso.status} detail={status.turso.detail} />
            <StatusRow label="SMTP" status={status.smtp.status} detail={status.smtp.detail} />
          </tbody>
        </table>
      </div>
    </section>
  )
}
