"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ApartmentRecord, ReservationWithApartment } from "@/lib/reservations"
import { useToast } from "./admin-toast"
import { useConfirm } from "./confirm-dialog"
import { ReservationDetailModal, SOURCE_LABELS } from "./reservation-detail-modal"

const inputClass = "rounded-[2px] border border-mid/20 bg-pale px-3 py-2 text-sm text-dark outline-none focus:border-dark"

function toCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

function buildCsv(rows: ReservationWithApartment[]): string {
  const headers = ["Apartmán", "Host", "Email", "Telefon", "Příjezd", "Odjezd", "Počet hostů", "Zdroj", "Stav", "Poznámka"]
  const lines = [headers.map(toCsvValue).join(",")]

  for (const reservation of rows) {
    lines.push(
      [
        reservation.apartmentName,
        reservation.name || "",
        reservation.email || "",
        reservation.phone || "",
        reservation.startDate,
        reservation.endDate,
        reservation.guests !== null ? String(reservation.guests) : "",
        SOURCE_LABELS[reservation.source] || reservation.source,
        reservation.status === "active" ? "Aktivní" : "Zrušená",
        reservation.note || ""
      ]
        .map(toCsvValue)
        .join(",")
    )
  }

  return lines.join("\n")
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

interface Filters {
  dateFrom: string
  dateTo: string
  apartmentId: string
  source: string
  status: string
  search: string
}

const EMPTY_FILTERS: Filters = { dateFrom: "", dateTo: "", apartmentId: "all", source: "all", status: "all", search: "" }

interface Props {
  reservations: ReservationWithApartment[]
  apartments: ApartmentRecord[]
}

export default function AdminReservations({ reservations, apartments }: Props) {
  const router = useRouter()
  const { showToast, toastElement } = useToast()
  const { confirm, confirmDialog } = useConfirm()

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [detailReservation, setDetailReservation] = useState<ReservationWithApartment | null>(null)
  const [editReservation, setEditReservation] = useState<ReservationWithApartment | null>(null)

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase()

    return reservations.filter((reservation) => {
      if (filters.dateFrom && reservation.endDate <= filters.dateFrom) return false
      if (filters.dateTo && reservation.startDate >= filters.dateTo) return false
      if (filters.apartmentId !== "all" && String(reservation.apartmentId) !== filters.apartmentId) return false
      if (filters.source !== "all" && reservation.source !== filters.source) return false
      if (filters.status !== "all" && reservation.status !== filters.status) return false
      if (search) {
        const haystack = `${reservation.name || ""} ${reservation.email || ""} ${reservation.note || ""}`.toLowerCase()
        if (!haystack.includes(search)) return false
      }
      return true
    })
  }, [reservations, filters])

  async function handleCancel(reservation: ReservationWithApartment) {
    const confirmed = await confirm({
      title: "Zrušit rezervaci?",
      message: `Rezervace ${reservation.apartmentName}, ${reservation.startDate} – ${reservation.endDate} bude zrušena a termín se uvolní.`,
      confirmLabel: "Zrušit rezervaci"
    })
    if (!confirmed) return

    setPendingId(reservation.id)
    try {
      const response = await fetch(`/api/admin/reservations/${reservation.id}`, { method: "PATCH" })
      const payload = await response.json()

      if (!response.ok) {
        showToast("error", payload.error || "Rezervaci se nepodařilo zrušit.")
        return
      }

      showToast("success", "Rezervace byla zrušena.")
      router.refresh()
    } finally {
      setPendingId(null)
    }
  }

  async function handleDelete(reservation: ReservationWithApartment) {
    const confirmed = await confirm({
      title: "Smazat rezervaci?",
      message: `Rezervace ${reservation.apartmentName}, ${reservation.startDate} – ${reservation.endDate} bude trvale smazána. Tuto akci nelze vrátit zpět.`,
      confirmLabel: "Smazat"
    })
    if (!confirmed) return

    setPendingId(reservation.id)
    try {
      const response = await fetch(`/api/admin/reservations/${reservation.id}`, { method: "DELETE" })
      const payload = await response.json()

      if (!response.ok) {
        showToast("error", payload.error || "Rezervaci se nepodařilo smazat.")
        return
      }

      showToast("success", "Rezervace byla smazána.")
      router.refresh()
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <FiltersBar filters={filters} setFilters={setFilters} apartments={apartments} />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => downloadCsv(buildCsv(filtered), `rezervace-${new Date().toISOString().slice(0, 10)}.csv`)}
          className="cursor-pointer rounded-[2px] border border-dark px-4 py-2 text-xs uppercase tracking-wide hover:bg-dark hover:text-cream"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-light text-left text-xs uppercase tracking-wide text-mid">
              <th className="py-2 pr-4">Apartmán</th>
              <th className="py-2 pr-4">Host</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Telefon</th>
              <th className="py-2 pr-4">Termín</th>
              <th className="py-2 pr-4">Hosté</th>
              <th className="py-2 pr-4">Zdroj</th>
              <th className="py-2 pr-4">Stav</th>
              <th className="py-2 pr-4">Poznámka</th>
              <th className="py-2 pr-4">Akce</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((reservation) => (
              <tr key={reservation.id} className="border-b border-light/60">
                <td className="py-2 pr-4">{reservation.apartmentName}</td>
                <td className="py-2 pr-4">{reservation.name || "-"}</td>
                <td className="py-2 pr-4">{reservation.email || "-"}</td>
                <td className="py-2 pr-4">{reservation.phone || "-"}</td>
                <td className="py-2 pr-4 whitespace-nowrap">
                  {reservation.startDate} – {reservation.endDate}
                </td>
                <td className="py-2 pr-4">{reservation.guests ?? "-"}</td>
                <td className="py-2 pr-4">{SOURCE_LABELS[reservation.source] || reservation.source}</td>
                <td className="py-2 pr-4">{reservation.status === "active" ? "Aktivní" : "Zrušená"}</td>
                <td className="py-2 pr-4">{reservation.note || "-"}</td>
                <td className="space-x-2 py-2 pr-4 whitespace-nowrap text-xs">
                  <button type="button" onClick={() => setDetailReservation(reservation)} className="cursor-pointer underline hover:text-dark">
                    Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditReservation(reservation)}
                    className="cursor-pointer underline hover:text-dark"
                  >
                    Editace
                  </button>
                  {reservation.status === "active" && (
                    <button
                      type="button"
                      onClick={() => handleCancel(reservation)}
                      disabled={pendingId === reservation.id}
                      className="cursor-pointer text-accent underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Storno
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(reservation)}
                    disabled={pendingId === reservation.id}
                    className="cursor-pointer text-accent underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Smazat
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="py-4 text-mid">
                  Žádné rezervace neodpovídají filtru.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {detailReservation && <ReservationDetailModal reservation={detailReservation} onClose={() => setDetailReservation(null)} />}
      {editReservation && (
        <EditModal
          reservation={editReservation}
          apartments={apartments}
          onClose={() => setEditReservation(null)}
          onSaved={() => {
            setEditReservation(null)
            showToast("success", "Rezervace byla upravena.")
            router.refresh()
          }}
          onError={(message) => showToast("error", message)}
        />
      )}
      {toastElement}
      {confirmDialog}
    </div>
  )
}

function FiltersBar({
  filters,
  setFilters,
  apartments
}: {
  filters: Filters
  setFilters: (filters: Filters) => void
  apartments: ApartmentRecord[]
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <input
        type="date"
        value={filters.dateFrom}
        onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })}
        className={inputClass}
        aria-label="Datum od"
      />
      <input
        type="date"
        value={filters.dateTo}
        onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })}
        className={inputClass}
        aria-label="Datum do"
      />
      <select
        value={filters.apartmentId}
        onChange={(event) => setFilters({ ...filters, apartmentId: event.target.value })}
        className={inputClass}
      >
        <option value="all">Všechny apartmány</option>
        {apartments.map((apartment) => (
          <option key={apartment.id} value={apartment.id}>
            {apartment.name}
          </option>
        ))}
      </select>
      <select value={filters.source} onChange={(event) => setFilters({ ...filters, source: event.target.value })} className={inputClass}>
        <option value="all">Všechny zdroje</option>
        <option value="website">Web</option>
        <option value="booking">Booking.com</option>
        <option value="airbnb">Airbnb</option>
        <option value="admin_block">Admin blokace</option>
      </select>
      <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className={inputClass}>
        <option value="all">Všechny stavy</option>
        <option value="active">Aktivní</option>
        <option value="cancelled">Zrušená</option>
      </select>
      <input
        type="text"
        value={filters.search}
        onChange={(event) => setFilters({ ...filters, search: event.target.value })}
        placeholder="Hledat jméno, email, poznámku…"
        className={inputClass}
      />
    </div>
  )
}

function EditModal({
  reservation,
  apartments,
  onClose,
  onSaved,
  onError
}: {
  reservation: ReservationWithApartment
  apartments: ApartmentRecord[]
  onClose: () => void
  onSaved: () => void
  onError: (message: string) => void
}) {
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-dark/60 px-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-lg rounded-[2px] bg-cream p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl">Upravit rezervaci</h2>
          <button type="button" onClick={onClose} className="cursor-pointer text-2xl leading-none text-mid hover:text-dark">
            ×
          </button>
        </div>
        <form
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault()
            setSaving(true)
            setFormError(null)
            const data = Object.fromEntries(new FormData(event.currentTarget).entries())

            try {
              const response = await fetch(`/api/admin/reservations/${reservation.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  apartmentId: Number(data.apartmentId),
                  startDate: data.startDate,
                  endDate: data.endDate,
                  name: data.name,
                  email: data.email,
                  phone: data.phone,
                  guests: data.guests ? Number(data.guests) : null,
                  note: data.note
                })
              })
              const payload = await response.json()

              if (!response.ok) {
                setFormError(payload.error || "Rezervaci se nepodařilo upravit.")
                onError(payload.error || "Rezervaci se nepodařilo upravit.")
                return
              }

              onSaved()
            } finally {
              setSaving(false)
            }
          }}
        >
          <label className="sm:col-span-2 text-xs uppercase tracking-wide text-mid">
            Apartmán
            <select name="apartmentId" defaultValue={reservation.apartmentId} required className={`mt-1 w-full ${inputClass}`}>
              {apartments.map((apartment) => (
                <option key={apartment.id} value={apartment.id}>
                  {apartment.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs uppercase tracking-wide text-mid">
            Příjezd
            <input type="date" name="startDate" defaultValue={reservation.startDate} required className={`mt-1 w-full ${inputClass}`} />
          </label>
          <label className="text-xs uppercase tracking-wide text-mid">
            Odjezd
            <input type="date" name="endDate" defaultValue={reservation.endDate} required className={`mt-1 w-full ${inputClass}`} />
          </label>
          <label className="text-xs uppercase tracking-wide text-mid">
            Jméno
            <input type="text" name="name" defaultValue={reservation.name || ""} className={`mt-1 w-full ${inputClass}`} />
          </label>
          <label className="text-xs uppercase tracking-wide text-mid">
            Email
            <input type="email" name="email" defaultValue={reservation.email || ""} className={`mt-1 w-full ${inputClass}`} />
          </label>
          <label className="text-xs uppercase tracking-wide text-mid">
            Telefon
            <input type="tel" name="phone" defaultValue={reservation.phone || ""} className={`mt-1 w-full ${inputClass}`} />
          </label>
          <label className="text-xs uppercase tracking-wide text-mid">
            Počet hostů
            <input type="number" min="1" name="guests" defaultValue={reservation.guests ?? ""} className={`mt-1 w-full ${inputClass}`} />
          </label>
          <label className="sm:col-span-2 text-xs uppercase tracking-wide text-mid">
            Poznámka
            <textarea name="note" defaultValue={reservation.note || ""} rows={3} className={`mt-1 w-full resize-y ${inputClass}`} />
          </label>

          {formError && <p className="text-sm text-accent sm:col-span-2">{formError}</p>}

          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-[2px] border border-mid/30 px-4 py-2 text-sm uppercase tracking-wide hover:bg-pale"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded-[2px] bg-dark px-4 py-2 text-sm uppercase tracking-wide text-cream hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Ukládám…" : "Uložit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
