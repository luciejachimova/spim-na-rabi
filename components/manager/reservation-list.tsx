"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { formatDateRange, formatDogs, formatGuests, formatMoney, formatNights } from "@/lib/format"
import { countNights } from "@/lib/reservations/overlap"
import { RESERVATION_STATUS_LABELS } from "@/lib/reservations/status"
import type { ReservationSource, ReservationStatus, ReservationWithApartment } from "@/lib/reservations/types"
import type { ApartmentFilterOption } from "@/lib/reservations/manager-data"
import { SOURCE_LABELS } from "@/components/reservation-detail-modal"

type PeriodFilter = "upcoming" | "current" | "past" | "all"

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  upcoming: "Nadcházející",
  current: "Probíhající",
  past: "Proběhlé",
  all: "Vše"
}

const STATUS_STYLES: Record<ReservationStatus, string> = {
  confirmed: "bg-dark text-sand",
  inquiry: "bg-accent/20 text-dark",
  cancelled: "bg-transparent text-mid border border-mid/40",
  no_show: "bg-transparent text-accent border border-accent/40"
}

export function StatusBadge({ status }: { status: ReservationStatus }) {
  return (
    <span className={`inline-block rounded-[2px] px-1.5 py-0.5 text-[11px] tracking-wide ${STATUS_STYLES[status]}`}>
      {RESERVATION_STATUS_LABELS[status]}
    </span>
  )
}

export default function ReservationList({
  reservations,
  apartments,
  today
}: {
  reservations: ReservationWithApartment[]
  apartments: ApartmentFilterOption[]
  today: string
}) {
  const [apartmentId, setApartmentId] = useState<number | "all">("all")
  const [status, setStatus] = useState<ReservationStatus | "all">("all")
  const [source, setSource] = useState<ReservationSource | "all">("all")
  const [period, setPeriod] = useState<PeriodFilter>("upcoming")
  const [dogsOnly, setDogsOnly] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return reservations.filter((reservation) => {
      if (apartmentId !== "all" && reservation.apartmentId !== apartmentId) return false
      if (status !== "all" && reservation.status !== status) return false
      if (source !== "all" && reservation.source !== source) return false
      if (dogsOnly && !reservation.hasDog) return false

      // Half-open range again: a stay ending today has already ended.
      if (period === "upcoming" && reservation.startDate < today) return false
      if (period === "current" && !(reservation.startDate <= today && reservation.endDate > today)) return false
      if (period === "past" && reservation.endDate > today) return false

      if (query) {
        const haystack = [reservation.name, reservation.email, reservation.phone, reservation.note]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(query)) return false
      }

      return true
    })
  }, [reservations, apartmentId, status, source, period, dogsOnly, search, today])

  const selectClass =
    "rounded-[2px] border border-dark/15 bg-white px-2.5 py-2 text-sm text-dark outline-none focus:border-dark"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setPeriod(value)}
            aria-pressed={period === value}
            className={`cursor-pointer rounded-[2px] px-3 py-1.5 text-sm transition-colors ${
              period === value ? "bg-dark text-sand" : "border border-dark/15 bg-white text-mid hover:text-dark"
            }`}
          >
            {PERIOD_LABELS[value]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Jméno, e-mail, telefon…"
          className={`${selectClass} min-w-[12rem] flex-1`}
        />
        <select value={apartmentId} onChange={(event) => setApartmentId(event.target.value === "all" ? "all" : Number(event.target.value))} className={selectClass}>
          <option value="all">Všechny apartmány</option>
          {apartments.map((apartment) => (
            <option key={apartment.id} value={apartment.id}>
              {apartment.shortLabel || apartment.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value as ReservationStatus | "all")} className={selectClass}>
          <option value="all">Všechny stavy</option>
          {Object.entries(RESERVATION_STATUS_LABELS).map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </select>
        <select value={source} onChange={(event) => setSource(event.target.value as ReservationSource | "all")} className={selectClass}>
          <option value="all">Všechny zdroje</option>
          {Object.entries(SOURCE_LABELS).map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2 rounded-[2px] border border-dark/15 bg-white px-2.5 py-2 text-sm">
          <input type="checkbox" checked={dogsOnly} onChange={(event) => setDogsOnly(event.target.checked)} className="h-4 w-4 cursor-pointer accent-dark" />
          Jen se psem
        </label>
      </div>

      <p className="text-sm text-mid">
        {filtered.length === 0
          ? "Žádná rezervace neodpovídá filtru."
          : `${filtered.length} ${filtered.length === 1 ? "rezervace" : filtered.length <= 4 ? "rezervace" : "rezervací"}`}
      </p>

      <ul className="space-y-2">
        {filtered.map((reservation) => {
          const apartment = apartments.find((item) => item.id === reservation.apartmentId)
          const nights = countNights(reservation.startDate, reservation.endDate)
          const dogs = formatDogs(reservation.hasDog, reservation.dogsCount)
          const price = formatMoney(reservation.priceCents, reservation.currency)
          const isBlock = reservation.source === "admin_block"

          return (
            <li key={reservation.id}>
              <Link
                href={`/manager/rezervace/${reservation.id}`}
                className="flex gap-3 rounded-[2px] border border-dark/10 bg-white p-3 transition-colors hover:border-dark/30"
              >
                {/* Colour bar rather than a text label: on a phone it is the
                    fastest way to tell the two apartments apart while scrolling. */}
                <span
                  aria-hidden="true"
                  className="w-1 shrink-0 rounded-full"
                  style={{ background: apartment?.color ?? "#333333" }}
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="truncate text-base">
                      {isBlock ? <span className="text-mid">Blokace</span> : reservation.name || <span className="text-mid">Bez jména</span>}
                    </span>
                    <StatusBadge status={reservation.status} />
                  </div>
                  <p className="text-sm text-mid">
                    {apartment?.shortLabel || reservation.apartmentName} · {formatDateRange(reservation.startDate, reservation.endDate)}
                    {nights > 0 && ` · ${formatNights(nights)}`}
                  </p>
                  {!isBlock && (
                    <p className="text-sm text-mid">
                      {formatGuests(reservation.adults, reservation.children)}
                      {dogs && ` · ${dogs}`}
                      {price && ` · ${price}`}
                      {reservation.isPaid && price && " · zaplaceno"}
                    </p>
                  )}
                  {(reservation.source === "booking" || reservation.source === "airbnb") && (
                    <p className="text-xs text-mid">{SOURCE_LABELS[reservation.source]}</p>
                  )}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
