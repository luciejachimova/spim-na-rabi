"use client"

import { useActionState, useMemo, useState } from "react"
import Link from "next/link"
import { EMPTY_FORM_STATE, type ManagerFormState } from "@/app/manager/form-state"
import { centsToInput, formatDateRange, formatNights } from "@/lib/format"
import { countNights, findConflicts, type BlockedRange } from "@/lib/reservations/overlap"
import { RESERVATION_STATUS_LABELS, SELECTABLE_STATUSES } from "@/lib/reservations/status"
import type { ReservationSource, ReservationStatus, ReservationWithApartment } from "@/lib/reservations/types"
import type { ApartmentOption } from "@/lib/reservations/manager-data"

const SOURCE_OPTIONS: { value: ReservationSource; label: string }[] = [
  { value: "phone", label: "Telefon" },
  { value: "email", label: "E-mail" },
  { value: "website", label: "Web" },
  { value: "booking", label: "Booking.com" },
  { value: "airbnb", label: "Airbnb" },
  { value: "admin_block", label: "Blokace" }
]

// text-base, not text-sm: iOS Safari zooms the whole page when a focused input
// has a font smaller than 16px, and the form is used mostly on a phone.
//
// focus-visible:ring rather than only a border colour change. `outline-none`
// removes the browser's focus ring, and swapping a 1px border from dark/15 to
// dark is close to invisible — someone tabbing through the form would lose
// track of where they are.
const field =
  "w-full rounded-[2px] border border-dark/15 bg-white px-3 py-2.5 text-base text-dark outline-none transition-colors focus:border-dark focus-visible:ring-2 focus-visible:ring-dark/40"
const label = "block text-xs uppercase tracking-wide text-muted"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-dark/10 pt-5 first:border-0 first:pt-0">
      <h2 className="text-xs uppercase tracking-[0.14em] text-muted">{title}</h2>
      {children}
    </section>
  )
}

function Stepper({
  name,
  value,
  onChange,
  min = 0,
  max = 20,
  labelText
}: {
  name: string
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  labelText: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{labelText}</span>
      <div className="flex items-center gap-1">
        {/* Steppers rather than a number input: on a phone this is one thumb tap
            instead of summoning the numeric keypad for a value that is 1–4.
            44px square — the smallest target a thumb hits reliably, and below
            what h-10 (40px) gave. */}
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`${labelText} − 1`}
          className="grid h-11 w-11 cursor-pointer place-items-center rounded-[2px] border border-dark/15 bg-white text-lg leading-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <output className="w-9 text-center text-base tabular-nums">{value}</output>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`${labelText} + 1`}
          className="grid h-11 w-11 cursor-pointer place-items-center rounded-[2px] border border-dark/15 bg-white text-lg leading-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  )
}

export interface ReservationFormProps {
  apartments: ApartmentOption[]
  blockedRanges: BlockedRange[]
  reservation?: ReservationWithApartment
  action: (state: ManagerFormState, formData: FormData) => Promise<ManagerFormState>
  submitLabel: string
}

export default function ReservationForm({ apartments, blockedRanges, reservation, action, submitLabel }: ReservationFormProps) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE)

  const [apartmentId, setApartmentId] = useState(reservation?.apartmentId ?? apartments[0]?.id ?? 0)
  const [startDate, setStartDate] = useState(reservation?.startDate ?? "")
  const [endDate, setEndDate] = useState(reservation?.endDate ?? "")
  const [adults, setAdults] = useState(reservation?.adults ?? 2)
  const [children, setChildren] = useState(reservation?.children ?? 0)
  const [hasDog, setHasDog] = useState(reservation?.hasDog ?? false)
  const [dogsCount, setDogsCount] = useState(reservation?.dogsCount || 1)
  const [status, setStatus] = useState<ReservationStatus>(reservation?.status ?? "confirmed")
  const [source, setSource] = useState<ReservationSource>(reservation?.source ?? "phone")

  const apartment = apartments.find((item) => item.id === apartmentId)
  const nights = countNights(startDate, endDate)

  // Computed locally from the ranges the server handed over, so the warning
  // appears as the date is picked instead of after submitting. The atomic SQL
  // check at write time is still the authority — this is only feedback.
  const conflicts = useMemo(
    () => findConflicts(blockedRanges, { apartmentId, startDate, endDate, excludeReservationId: reservation?.id }),
    [blockedRanges, apartmentId, startDate, endDate, reservation?.id]
  )

  const datesInverted = Boolean(startDate && endDate && startDate >= endDate)
  const isBlock = source === "admin_block"

  // Capacity and the pet rule are warnings, never blocks: the owner sometimes
  // knowingly takes an extra guest or a dog, and a form that refuses would just
  // get worked around by editing the database.
  const overCapacity =
    apartment && !isBlock ? adults > apartment.maxAdults || children > apartment.maxChildren : false
  const dogNotAllowed = apartment ? hasDog && !apartment.petsAllowed : false

  const isExternal = reservation?.source === "booking" || reservation?.source === "airbnb"

  return (
    <form action={formAction} className="mx-auto max-w-xl space-y-6">
      {reservation && <input type="hidden" name="reservationId" value={reservation.id} />}

      {isExternal && (
        <p className="rounded-[2px] border border-dark/15 bg-white px-3 py-2.5 text-sm text-muted">
          Rezervace pochází z <strong className="text-dark">{reservation?.source === "booking" ? "Booking.com" : "Airbnb"}</strong>.
          Termín přepisuje synchronizace, ostatní údaje zůstanou tak, jak je uložíte.
        </p>
      )}

      <Section title="Apartmán">
        <div className="grid grid-cols-2 gap-2">
          {apartments.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setApartmentId(item.id)}
              aria-pressed={apartmentId === item.id}
              className={`cursor-pointer rounded-[2px] border px-3 py-3 text-left transition-colors ${
                apartmentId === item.id ? "border-dark bg-dark text-sand" : "border-dark/15 bg-white hover:border-dark/40"
              }`}
            >
              <span className="block text-sm">{item.shortLabel || item.name}</span>
              <span className={`block text-xs ${apartmentId === item.id ? "text-sand/70" : "text-muted"}`}>{item.name}</span>
            </button>
          ))}
        </div>
        <input type="hidden" name="apartmentId" value={apartmentId} />
      </Section>

      <Section title="Termín">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={label} htmlFor="startDate">
              Příjezd
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              required
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className={field}
            />
          </div>
          <div className="space-y-1">
            <label className={label} htmlFor="endDate">
              Odjezd
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              required
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className={field}
            />
          </div>
        </div>

        {nights > 0 && (
          <p className="text-sm text-muted">
            {formatNights(nights)}
            {apartment && ` · příjezd od ${apartment.checkInFrom}, odjezd do ${apartment.checkOutUntil}`}
          </p>
        )}

        {/* aria-live so the warning is announced when it appears, rather than
            only being visible to someone looking at that part of the screen. */}
        <div role="status" aria-live="polite" className="space-y-3 empty:hidden">
          {datesInverted && <p className="text-sm text-alert">Odjezd musí být po příjezdu.</p>}

          {conflicts.length > 0 && (
          <div className="rounded-[2px] border border-alert bg-alert/10 px-3 py-2.5 text-sm">
            <p className="font-medium text-dark">Termín je už obsazený</p>
            <ul className="mt-1 space-y-0.5 text-muted">
              {conflicts.map((conflict) => (
                <li key={conflict.id}>
                  {conflict.label} · {formatDateRange(conflict.startDate, conflict.endDate)}
                  {conflict.status === "inquiry" && " (poptávka)"}
                </li>
              ))}
            </ul>
          </div>
          )}
        </div>
      </Section>

      <Section title="Stav a zdroj">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={label} htmlFor="status">
              Stav
            </label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(event) => setStatus(event.target.value as ReservationStatus)}
              className={field}
            >
              {SELECTABLE_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {RESERVATION_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className={label} htmlFor="source">
              Zdroj
            </label>
            <select
              id="source"
              name="source"
              value={source}
              onChange={(event) => setSource(event.target.value as ReservationSource)}
              className={field}
            >
              {SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {status === "cancelled" && (
          <div className="space-y-1">
            <label className={label} htmlFor="cancelReason">
              Důvod storna
            </label>
            <input
              id="cancelReason"
              name="cancelReason"
              type="text"
              defaultValue={reservation?.cancelReason ?? ""}
              placeholder="např. host zrušil telefonicky"
              className={field}
            />
          </div>
        )}
      </Section>

      {!isBlock && (
        <Section title="Host">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className={label} htmlFor="name">
                Jméno
              </label>
              <input id="name" name="name" type="text" defaultValue={reservation?.name ?? ""} className={field} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className={label} htmlFor="phone">
                  Telefon
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  defaultValue={reservation?.phone ?? ""}
                  className={field}
                />
              </div>
              <div className="space-y-1">
                <label className={label} htmlFor="email">
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  defaultValue={reservation?.email ?? ""}
                  className={field}
                />
              </div>
            </div>
          </div>
        </Section>
      )}

      {!isBlock && (
        <Section title="Obsazenost">
          <div className="space-y-3 rounded-[2px] border border-dark/10 bg-white/60 p-3">
            <Stepper name="adults" labelText="Dospělí" value={adults} onChange={setAdults} min={0} />
            <Stepper name="children" labelText="Děti" value={children} onChange={setChildren} min={0} />

            {children > 0 && (
              <div className="space-y-1">
                <label className={label} htmlFor="childrenAges">
                  Věk dětí
                </label>
                {/* Asked because it decides whether a cot goes in the room. */}
                <input
                  id="childrenAges"
                  name="childrenAges"
                  type="text"
                  defaultValue={reservation?.childrenAges ?? ""}
                  placeholder="např. 3, 7"
                  className={field}
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-dark/10 pt-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm" htmlFor="hasDog">
                <input
                  id="hasDog"
                  name="hasDog"
                  type="checkbox"
                  checked={hasDog}
                  onChange={(event) => setHasDog(event.target.checked)}
                  className="h-5 w-5 cursor-pointer accent-dark"
                />
                Pobyt se psem
              </label>
              {hasDog && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDogsCount(Math.max(1, dogsCount - 1))}
                    disabled={dogsCount <= 1}
                    aria-label="Méně psů"
                    className="grid h-11 w-11 cursor-pointer place-items-center rounded-[2px] border border-dark/15 bg-white text-lg leading-none disabled:opacity-40"
                  >
                    −
                  </button>
                  <output className="w-9 text-center text-base tabular-nums">{dogsCount}</output>
                  <button
                    type="button"
                    onClick={() => setDogsCount(Math.min(5, dogsCount + 1))}
                    aria-label="Více psů"
                    className="grid h-11 w-11 cursor-pointer place-items-center rounded-[2px] border border-dark/15 bg-white text-lg leading-none"
                  >
                    +
                  </button>
                  <input type="hidden" name="dogsCount" value={dogsCount} />
                </div>
              )}
            </div>
          </div>

          <div role="status" aria-live="polite" className="space-y-3 empty:hidden">
            {overCapacity && apartment && (
              <p className="text-sm text-alert">
                {apartment.name} je uvedený pro {apartment.maxAdults} dospělé
                {apartment.maxChildren > 0 && ` a ${apartment.maxChildren} děti`}. Uložit to lze, jen si to ověřte.
              </p>
            )}
            {dogNotAllowed && apartment && (
              <p className="text-sm text-alert">{apartment.name} nemá povolené psy. Uložit to lze, jen si to ověřte.</p>
            )}
          </div>
        </Section>
      )}

      {!isBlock && (
        <Section title="Cena">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className={label} htmlFor="price">
                Cena celkem (Kč)
              </label>
              <input
                id="price"
                name="price"
                type="text"
                inputMode="decimal"
                defaultValue={centsToInput(reservation?.priceCents)}
                placeholder="8400"
                className={field}
              />
            </div>
            <div className="space-y-1">
              <label className={label} htmlFor="deposit">
                Záloha (Kč)
              </label>
              <input
                id="deposit"
                name="deposit"
                type="text"
                inputMode="decimal"
                defaultValue={centsToInput(reservation?.depositCents)}
                placeholder="2000"
                className={field}
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm" htmlFor="isPaid">
            <input
              id="isPaid"
              name="isPaid"
              type="checkbox"
              defaultChecked={reservation?.isPaid ?? false}
              className="h-5 w-5 cursor-pointer accent-dark"
            />
            Zaplaceno
          </label>
        </Section>
      )}

      <Section title="Doplňující údaje">
        {!isBlock && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={label} htmlFor="arrivalTime">
                Čas příjezdu
              </label>
              <input
                id="arrivalTime"
                name="arrivalTime"
                type="time"
                defaultValue={reservation?.arrivalTime ?? ""}
                className={field}
              />
            </div>
            <div className="space-y-1">
              <label className={label} htmlFor="departureTime">
                Čas odjezdu
              </label>
              <input
                id="departureTime"
                name="departureTime"
                type="time"
                defaultValue={reservation?.departureTime ?? ""}
                className={field}
              />
            </div>
          </div>
        )}

        {!isBlock && (
          <div className="space-y-1">
            <label className={label} htmlFor="guestNote">
              Poznámka od hosta
            </label>
            <textarea
              id="guestNote"
              name="guestNote"
              rows={2}
              defaultValue={reservation?.guestNote ?? ""}
              className={`${field} resize-y`}
            />
          </div>
        )}

        <div className="space-y-1">
          <label className={label} htmlFor="note">
            Interní poznámka
          </label>
          <textarea id="note" name="note" rows={2} defaultValue={reservation?.note ?? ""} className={`${field} resize-y`} />
        </div>
      </Section>

      {state.error && (
        <p role="alert" className="rounded-[2px] border border-alert bg-alert/10 px-3 py-2.5 text-sm text-dark">
          {state.error}
        </p>
      )}

      {/* Sticky so Save stays reachable without scrolling back up a long form */}
      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] flex gap-2 border-t border-dark/10 bg-sand/95 py-3 backdrop-blur-sm md:bottom-0">
        <button
          type="submit"
          disabled={pending || datesInverted}
          className="flex-1 cursor-pointer rounded-[2px] bg-dark px-4 py-3 text-sm uppercase tracking-wide text-sand transition-colors hover:bg-alert disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Ukládám…" : submitLabel}
        </button>
        <Link
          href={reservation ? `/manager/rezervace/${reservation.id}` : "/manager/rezervace"}
          className="cursor-pointer rounded-[2px] border border-dark/20 px-4 py-3 text-sm uppercase tracking-wide text-muted transition-colors hover:border-dark hover:text-dark"
        >
          Zrušit
        </Link>
      </div>
    </form>
  )
}
