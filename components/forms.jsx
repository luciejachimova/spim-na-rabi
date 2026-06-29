"use client"

import { useState } from "react"

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
      return
    }

    form.reset()
    setStatus({ type: "success", message: payload.message || "Děkujeme, ozveme se vám." })
  } catch {
    setStatus({ type: "error", message: "Formulář se nepodařilo odeslat. Zkuste to prosím znovu." })
  }
}

function StatusMessage({ status }) {
  if (!status) return null

  return (
    <div className={`border p-4 text-sm leading-relaxed ${status.type === "error" ? "border-accent/40 bg-pale text-dark" : "border-mid/20 bg-pale text-mid"}`}>
      {status.message}
    </div>
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

export function ReservationForm({ onSuccess }) {
  const [status, setStatus] = useState(null)
  const loading = status?.type === "loading"

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        await submitForm("/api/reservation", event.currentTarget, setStatus)
        onSuccess?.()
      }}
    >
      <StatusMessage status={status} />

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
          <select id="reservation-apartment" name="apartment" className={inputClass} defaultValue="">
            <option value="">Vyberte apartmán</option>
            <option>Apartmán 1 - Studio ³</option>
            <option>Apartmán 2 - Loft ¹⁰</option>
            <option>Je mi to jedno</option>
          </select>
        </div>
        <div>
          <label htmlFor="reservation-date-from" className={labelClass}>Příjezd</label>
          <input id="reservation-date-from" name="dateFrom" type="date" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="reservation-date-to" className={labelClass}>Odjezd</label>
          <input id="reservation-date-to" name="dateTo" type="date" required className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="reservation-guests" className={labelClass}>Počet hostů</label>
        <input id="reservation-guests" name="guests" type="number" min="1" required placeholder="2" className={inputClass} />
      </div>

      <div>
        <label htmlFor="reservation-note" className={labelClass}>Poznámka</label>
        <textarea id="reservation-note" name="note" rows={4} placeholder="Napište nám termín, přání nebo dotaz..." className={`${inputClass} resize-y`} />
      </div>

      <button type="submit" disabled={loading} className={buttonClass}>
        Odeslat rezervaci
      </button>
    </form>
  )
}
