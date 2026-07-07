"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { apartments } from "@/data/content"
import { AvailabilityCalendar } from "./availability-calendar"
import { useReservation } from "./ClientChrome"

const inputClass = "w-full rounded-[2px] border border-mid/20 bg-pale px-4 py-[0.85rem] font-jost text-[0.9rem] text-dark outline-none transition-colors duration-200 focus:border-dark"
const labelClass = "mb-2 block text-[0.7rem] uppercase tracking-[0.16em] text-mid"
const buttonClass = "cursor-pointer rounded-[2px] border-none bg-dark px-10 py-[0.9rem] text-[0.78rem] font-medium uppercase tracking-[0.18em] text-cream transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"

async function submitForm(endpoint, form, setStatus) {
  setStatus({ type: "loading", message: "Odesílám..." })
  const data = Object.fromEntries(new FormData(form).entries())

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
    const payload = await response.json()

    if (!response.ok) {
      setStatus({ type: "error", message: payload.error || "Formulář se nepodařilo odeslat." })
      return null
    }

    form.reset()
    setStatus({ type: "success", message: payload.message || "Děkujeme, ozveme se vám." })
    return payload
  } catch {
    setStatus({ type: "error", message: "Formulář se nepodařilo odeslat. Zkuste to prosím znovu." })
    return null
  }
}

function StatusMessage({ status }) {
  if (!status) return null

  return (
    <p
      className={`text-sm leading-relaxed transition-opacity duration-200 ${
        status.type === "error" ? "text-accent" : status.type === "success" ? "text-dark" : "text-mid"
      }`}
      role={status.type === "error" ? "alert" : "status"}
    >
      {status.message}
    </p>
  )
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-cream/40 border-t-cream"
      aria-hidden="true"
    />
  )
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 animate-check-pop text-green-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

export function ContactForm() {
  const [status, setStatus] = useState(null)
  const loading = status?.type === "loading"

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        submitForm("/api/contact", event.currentTarget, setStatus)
      }}
    >
      <StatusMessage status={status} />

      <div>
        <label htmlFor="contact-name" className={labelClass}>Jméno</label>
        <input id="contact-name" name="name" required placeholder="Vaše jméno" className={inputClass} />
      </div>

      <div>
        <label htmlFor="contact-email" className={labelClass}>Email</label>
        <input id="contact-email" name="email" type="email" required placeholder="vas@email.cz" className={inputClass} />
      </div>

      <div>
        <label htmlFor="contact-phone" className={labelClass}>Telefon</label>
        <input id="contact-phone" name="phone" type="tel" placeholder="+420" className={inputClass} />
      </div>

      <div>
        <label htmlFor="contact-body" className={labelClass}>Zpráva</label>
        <textarea id="contact-body" name="body" rows={6} required placeholder="Napište nám..." className={`${inputClass} resize-y`} />
      </div>

      <button type="submit" disabled={loading} className={buttonClass}>
        Odeslat zprávu
      </button>
    </form>
  )
}

const SLOW_SUBMIT_NOTICE_DELAY_MS = 2000
const SUCCESS_ANIMATION_DELAY_MS = 900

export function ReservationForm() {
  const [status, setStatus] = useState(null)
  const [apartmentSelection, setApartmentSelection] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const router = useRouter()
  const { closeReservation } = useReservation()

  const isSubmitting = status?.type === "submitting"
  const isSuccess = status?.type === "success"
  const isBusy = isSubmitting || isSuccess

  async function handleSubmit(event) {
    event.preventDefault()

    // Belt-and-suspenders against a double submit: the fieldset/button are
    // already disabled while busy, but this guards a stray event that slips
    // in before React re-renders.
    if (isBusy) return

    if (!dateFrom || !dateTo) {
      setStatus({ type: "error", message: "Vyberte prosím termín příjezdu a odjezdu v kalendáři." })
      return
    }

    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())

    setStatus({ type: "submitting", message: "Vytváříme vaši rezervaci…" })

    const slowNoticeTimer = setTimeout(() => {
      setStatus((current) =>
        current?.type === "submitting"
          ? { type: "submitting", message: "Kontrolujeme dostupnost apartmánu a dokončujeme rezervaci…" }
          : current
      )
    }, SLOW_SUBMIT_NOTICE_DELAY_MS)

    let payload
    try {
      const response = await fetch("/api/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      payload = await response.json()

      if (!response.ok) {
        clearTimeout(slowNoticeTimer)
        setStatus({ type: "error", message: payload.error || "Rezervaci se nepodařilo odeslat. Zkuste to prosím znovu." })
        return
      }
    } catch {
      clearTimeout(slowNoticeTimer)
      setStatus({ type: "error", message: "Rezervaci se nepodařilo odeslat. Zkontrolujte připojení a zkuste to prosím znovu." })
      return
    }

    clearTimeout(slowNoticeTimer)
    setStatus({ type: "success", message: "Rezervace byla úspěšně vytvořena." })

    setTimeout(() => {
      closeReservation()
      router.push(`/rezervace-vytvorena?token=${payload.reservationToken}`)
    }, SUCCESS_ANIMATION_DELAY_MS)
  }

  const buttonLabel = isSubmitting ? "Odesíláme…" : isSuccess ? "Hotovo" : "Odeslat rezervaci"

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <StatusMessage status={status} />

      <fieldset disabled={isBusy} className="m-0 space-y-5 border-0 p-0">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="reservation-name" className={labelClass}>Jméno</label>
            <input id="reservation-name" name="name" required placeholder="Vaše jméno" className={inputClass} />
          </div>
          <div>
            <label htmlFor="reservation-email" className={labelClass}>Email</label>
            <input id="reservation-email" name="email" type="email" required placeholder="vas@email.cz" className={inputClass} />
          </div>
          <div>
            <label htmlFor="reservation-phone" className={labelClass}>Telefon</label>
            <input id="reservation-phone" name="phone" type="tel" placeholder="+420" className={inputClass} />
          </div>
          <div>
            <label htmlFor="reservation-apartment" className={labelClass}>Apartmán</label>
            <select
              id="reservation-apartment"
              name="apartment_selection"
              required
              className={inputClass}
              value={apartmentSelection}
              onChange={(event) => setApartmentSelection(event.target.value)}
            >
              <option value="">Vyberte apartmán</option>
              <option value="any">Je mi to jedno</option>
              {apartments.map((apartment) => (
                <option key={apartment.slug} value={apartment.slug}>
                  {apartment.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Termín pobytu</label>
          <input type="hidden" name="dateFrom" value={dateFrom} />
          <input type="hidden" name="dateTo" value={dateTo} />
          <AvailabilityCalendar
            apartmentSelection={apartmentSelection}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onChange={({ dateFrom: nextFrom, dateTo: nextTo }) => {
              setDateFrom(nextFrom)
              setDateTo(nextTo)
            }}
          />
        </div>

        <div>
          <label htmlFor="reservation-guests" className={labelClass}>Počet hostů</label>
          <input id="reservation-guests" name="guests" type="number" min="1" required placeholder="2" className={inputClass} />
        </div>

        <div>
          <label htmlFor="reservation-note" className={labelClass}>Poznámka</label>
          <textarea id="reservation-note" name="note" rows={4} placeholder="Napište nám termín, přání nebo dotaz..." className={`${inputClass} resize-y`} />
        </div>

        <button
          type="submit"
          className={`${buttonClass} flex w-full items-center justify-center gap-2 md:w-auto ${
            isSuccess ? "!bg-green-700 hover:!bg-green-700" : ""
          }`}
        >
          {isSubmitting && <Spinner />}
          {isSuccess && <CheckIcon />}
          <span>{buttonLabel}</span>
        </button>
      </fieldset>
    </form>
  )
}
