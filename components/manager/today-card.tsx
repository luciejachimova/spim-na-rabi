import Link from "next/link"
import { formatDate, formatDogs, formatGuests, formatMoney, formatNights } from "@/lib/format"
import { countNights } from "@/lib/reservations/overlap"
import { SOURCE_LABELS } from "@/lib/reservations/status"
import type { TodayStay } from "@/lib/reservations/today"

type Variant = "arrival" | "departure" | "staying"

const VARIANT: Record<Variant, { icon: string; label: string }> = {
  arrival: { icon: "↓", label: "Příjezd" },
  departure: { icon: "↑", label: "Odjezd" },
  staying: { icon: "•", label: "Ubytovaní" }
}

/**
 * One stay as it matters at the door. Ordered by what gets looked at first:
 * apartment and time, then who and how many, then whether money is settled.
 */
export function TodayCard({ stay, variant }: { stay: TodayStay; variant: Variant }) {
  const dogs = formatDogs(stay.hasDog, stay.dogsCount)
  const price = formatMoney(stay.priceCents, stay.currency)
  const isBlock = stay.source === "admin_block"
  // Only arrivals and departures happen at a time of day; a stay in progress
  // is described by when it ends, which is a date.
  const time =
    variant === "arrival"
      ? stay.arrivalTime || `od ${stay.checkInFrom}`
      : stay.departureTime || `do ${stay.checkOutUntil}`

  return (
    <div className="flex gap-3 rounded-[2px] border border-dark/10 bg-white p-3">
      <span aria-hidden="true" className="w-1 shrink-0 rounded-full" style={{ background: stay.apartmentColor }} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="text-base">
            <span aria-hidden="true" className="mr-1 text-muted">
              {VARIANT[variant].icon}
            </span>
            {isBlock ? <span className="text-muted">Blokace</span> : stay.name || <span className="text-muted">Bez jména</span>}
          </span>
          {variant !== "staying" && <span className="text-sm text-muted">{time}</span>}
        </div>

        <p className="text-sm text-muted">
          {stay.apartmentShortLabel || stay.apartmentName}
          {!isBlock && ` · ${formatGuests(stay.adults, stay.children)}`}
          {dogs && ` · 🐕 ${dogs}`}
          {variant === "staying" && ` · odjezd ${formatDate(stay.endDate)} do ${stay.checkOutUntil}`}
          {variant === "arrival" && ` · ${formatNights(countNights(stay.startDate, stay.endDate))}`}
        </p>

        {!isBlock && price && (
          <p className="text-sm">
            {price}
            {stay.isPaid ? (
              <span className="text-muted"> · zaplaceno</span>
            ) : (
              // Shown in the alert colour rather than left blank: the moment
              // to collect money is while the guest is standing here.
              <strong className="font-medium text-alert"> · nezaplaceno</strong>
            )}
          </p>
        )}

        {stay.guestNote && <p className="text-sm text-muted italic">„{stay.guestNote}“</p>}
        {stay.note && <p className="text-sm text-muted">{stay.note}</p>}
        {(stay.source === "booking" || stay.source === "airbnb") && (
          <p className="text-xs text-muted">{SOURCE_LABELS[stay.source]}</p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {stay.phone && (
            <a
              href={`tel:${stay.phone.replace(/\s/g, "")}`}
              className="cursor-pointer rounded-[2px] bg-dark px-3 py-2 text-xs uppercase tracking-wide text-sand transition-colors hover:bg-alert"
            >
              Zavolat
            </a>
          )}
          <Link
            href={`/manager/rezervace/${stay.id}`}
            className="cursor-pointer rounded-[2px] border border-dark/20 px-3 py-2 text-xs uppercase tracking-wide text-muted transition-colors hover:border-dark hover:text-dark"
          >
            Detail
          </Link>
        </div>
      </div>
    </div>
  )
}
