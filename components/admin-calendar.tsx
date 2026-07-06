"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ApartmentRecord, ReservationSource, ReservationWithApartment } from "@/lib/reservations"
import { ReservationDetailModal } from "./reservation-detail-modal"
import { useToast } from "./admin-toast"

const WEEKDAY_LABELS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"]
const MONTH_LABELS = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
]

const SOURCE_COLORS: Record<ReservationSource, string> = {
  booking: "bg-blue-200 text-blue-900",
  airbnb: "bg-green-200 text-green-900",
  website: "bg-orange-200 text-orange-900",
  admin_block: "bg-red-200 text-red-900"
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function addDays(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split("-").map(Number)
  return toDateKey(new Date(year, month - 1, day + amount))
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

interface Props {
  apartments: ApartmentRecord[]
  reservations: ReservationWithApartment[]
}

export default function AdminCalendar({ apartments, reservations }: Props) {
  const router = useRouter()
  const { showToast, toastElement } = useToast()
  const [apartmentId, setApartmentId] = useState<number | "">(apartments[0]?.id ?? "")
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()))
  const [detailReservation, setDetailReservation] = useState<ReservationWithApartment | null>(null)
  const [dragStart, setDragStart] = useState<string | null>(null)
  const [dragEnd, setDragEnd] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [pendingBlockRange, setPendingBlockRange] = useState<{ start: string; end: string } | null>(null)

  const todayKey = useMemo(() => toDateKey(new Date()), [])

  const reservationsByDay = useMemo(() => {
    const map = new Map<string, ReservationWithApartment>()
    if (apartmentId === "") return map

    for (const reservation of reservations) {
      if (reservation.apartmentId !== apartmentId || reservation.status !== "active") continue
      for (let cursor = reservation.startDate; cursor < reservation.endDate; cursor = addDays(cursor, 1)) {
        map.set(cursor, reservation)
      }
    }
    return map
  }, [reservations, apartmentId])

  const days = useMemo(() => {
    const firstDay = startOfMonth(visibleMonth)
    const startWeekday = (firstDay.getDay() + 6) % 7
    const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate()

    const cells: (Date | null)[] = []
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day))
    return cells
  }, [visibleMonth])

  useEffect(() => {
    function handleMouseUp() {
      if (!isDragging || !dragStart || !dragEnd) {
        setIsDragging(false)
        return
      }

      const start = dragStart < dragEnd ? dragStart : dragEnd
      const end = addDays(dragStart < dragEnd ? dragEnd : dragStart, 1)

      let rangeFree = true
      for (let cursor = start; cursor < end; cursor = addDays(cursor, 1)) {
        if (cursor < todayKey || reservationsByDay.has(cursor)) {
          rangeFree = false
          break
        }
      }

      setIsDragging(false)
      setDragStart(null)
      setDragEnd(null)

      if (!rangeFree) {
        showToast("error", "Vybrané období zahrnuje obsazený nebo minulý den.")
        return
      }

      setPendingBlockRange({ start, end })
    }

    window.addEventListener("mouseup", handleMouseUp)
    return () => window.removeEventListener("mouseup", handleMouseUp)
  }, [isDragging, dragStart, dragEnd, reservationsByDay, todayKey, showToast])

  function goToMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  const now = new Date()
  const isCurrentMonth = visibleMonth.getFullYear() === now.getFullYear() && visibleMonth.getMonth() === now.getMonth()

  function handleDayMouseDown(dateKey: string, occupied: boolean, past: boolean) {
    if (occupied || past || apartmentId === "") return
    setIsDragging(true)
    setDragStart(dateKey)
    setDragEnd(dateKey)
  }

  function handleDayMouseEnter(dateKey: string) {
    if (!isDragging) return
    setDragEnd(dateKey)
  }

  function handleDayClick(dateKey: string) {
    const reservation = reservationsByDay.get(dateKey)
    if (reservation) {
      setDetailReservation(reservation)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-medium">Kalendář</h2>
        <select
          value={apartmentId}
          onChange={(event) => setApartmentId(Number(event.target.value))}
          className="rounded-[2px] border border-mid/20 bg-pale px-3 py-2 text-sm text-dark"
        >
          {apartments.map((apartment) => (
            <option key={apartment.id} value={apartment.id}>
              {apartment.name}
            </option>
          ))}
        </select>
      </div>

      <div className="max-w-md rounded-[2px] border border-mid/20 bg-pale p-4 select-none">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            disabled={isCurrentMonth}
            className="cursor-pointer px-2 py-1 text-mid disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Předchozí měsíc"
          >
            ‹
          </button>
          <p className="text-sm font-medium uppercase tracking-wide text-dark">
            {MONTH_LABELS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
          </p>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            className="cursor-pointer px-2 py-1 text-mid hover:text-dark"
            aria-label="Následující měsíc"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[0.7rem] uppercase text-mid">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) return <div key={`empty-${index}`} />

            const dateKey = toDateKey(date)
            const reservation = reservationsByDay.get(dateKey)
            const past = dateKey < todayKey
            const dragLow = dragStart && dragEnd ? (dragStart < dragEnd ? dragStart : dragEnd) : null
            const dragHigh = dragStart && dragEnd ? (dragStart < dragEnd ? dragEnd : dragStart) : null
            const inDrag = isDragging && dragLow && dragHigh ? dateKey >= dragLow && dateKey <= dragHigh : false

            let className = "aspect-square rounded-[2px] text-xs transition-colors flex items-center justify-center "

            if (past) {
              className += "text-mid/40 cursor-not-allowed"
            } else if (inDrag) {
              className += "cursor-pointer bg-dark text-cream font-medium"
            } else if (reservation) {
              className += `cursor-pointer ${SOURCE_COLORS[reservation.source]}`
            } else {
              className += "cursor-pointer bg-cream text-dark hover:bg-accent/40"
            }

            return (
              <button
                type="button"
                key={dateKey}
                disabled={past}
                onMouseDown={() => handleDayMouseDown(dateKey, Boolean(reservation), past)}
                onMouseEnter={() => handleDayMouseEnter(dateKey)}
                onClick={() => handleDayClick(dateKey)}
                className={className}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-[0.68rem] text-mid">
          <Legend color="bg-blue-200" label="Booking.com" />
          <Legend color="bg-green-200" label="Airbnb" />
          <Legend color="bg-orange-200" label="Web" />
          <Legend color="bg-red-200" label="Blokace" />
        </div>
        <p className="mt-3 text-xs text-mid">Klikněte na rezervaci pro detail. Tažením přes volné dny vytvoříte blokaci.</p>
      </div>

      {detailReservation && <ReservationDetailModal reservation={detailReservation} onClose={() => setDetailReservation(null)} />}
      {pendingBlockRange && apartmentId !== "" && (
        <BlockRangeModal
          apartmentId={apartmentId}
          range={pendingBlockRange}
          onClose={() => setPendingBlockRange(null)}
          onCreated={() => {
            setPendingBlockRange(null)
            showToast("success", "Termín byl zablokován.")
            router.refresh()
          }}
          onError={(message) => showToast("error", message)}
        />
      )}
      {toastElement}
    </section>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block h-3 w-3 rounded-[2px] ${color}`} />
      {label}
    </span>
  )
}

function BlockRangeModal({
  apartmentId,
  range,
  onClose,
  onCreated,
  onError
}: {
  apartmentId: number
  range: { start: string; end: string }
  onClose: () => void
  onCreated: () => void
  onError: (message: string) => void
}) {
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-dark/60 px-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-sm rounded-[2px] bg-cream p-6 shadow-xl">
        <h2 className="mb-2 font-serif text-lg">Zablokovat termín?</h2>
        <p className="mb-4 text-sm text-mid">
          {range.start} – {range.end}
        </p>
        <label className="mb-1 block text-xs uppercase tracking-wide text-mid">Poznámka</label>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="Např. dovolená"
          className="mb-4 w-full resize-y rounded-[2px] border border-mid/20 bg-pale px-3 py-2 text-sm text-dark outline-none focus:border-dark"
        />
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-[2px] border border-mid/30 px-4 py-2 text-sm uppercase tracking-wide hover:bg-pale"
          >
            Zrušit
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true)
              try {
                const response = await fetch("/api/admin/block", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ apartmentId, startDate: range.start, endDate: range.end, note })
                })
                const payload = await response.json()

                if (!response.ok) {
                  onError(payload.error || "Blokaci se nepodařilo vytvořit.")
                  onClose()
                  return
                }

                onCreated()
              } finally {
                setSaving(false)
              }
            }}
            className="cursor-pointer rounded-[2px] bg-dark px-4 py-2 text-sm uppercase tracking-wide text-cream hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Ukládám…" : "Potvrdit"}
          </button>
        </div>
      </div>
    </div>
  )
}
