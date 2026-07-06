"use client"

import type { ReservationWithApartment } from "@/lib/reservations"

export const SOURCE_LABELS: Record<string, string> = {
  website: "Web",
  booking: "Booking.com",
  airbnb: "Airbnb",
  admin_block: "Blokováno majitelem"
}

// Shared between the reservations table and the calendar view — clicking a
// reservation in either place opens the same read-only detail.
export function ReservationDetailModal({
  reservation,
  onClose
}: {
  reservation: ReservationWithApartment
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-dark/60 px-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md rounded-[2px] bg-cream p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl">Detail rezervace</h2>
          <button type="button" onClick={onClose} className="cursor-pointer text-2xl leading-none text-mid hover:text-dark">
            ×
          </button>
        </div>
        <dl className="space-y-2 text-sm">
          <Row label="Apartmán" value={reservation.apartmentName} />
          <Row label="Termín" value={`${reservation.startDate} – ${reservation.endDate}`} />
          <Row label="Host" value={reservation.name || "-"} />
          <Row label="Email" value={reservation.email || "-"} />
          <Row label="Telefon" value={reservation.phone || "-"} />
          <Row label="Počet hostů" value={reservation.guests !== null ? String(reservation.guests) : "-"} />
          <Row label="Zdroj" value={SOURCE_LABELS[reservation.source] || reservation.source} />
          <Row label="Stav" value={reservation.status === "active" ? "Aktivní" : "Zrušená"} />
          <Row label="Poznámka" value={reservation.note || "-"} />
          <Row label="Vytvořeno" value={new Date(reservation.createdAt).toLocaleString("cs-CZ")} />
          <Row label="Upraveno" value={new Date(reservation.updatedAt).toLocaleString("cs-CZ")} />
        </dl>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-light/60 pb-2">
      <dt className="text-mid">{label}</dt>
      <dd className="text-right text-dark">{value}</dd>
    </div>
  )
}
