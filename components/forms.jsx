"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { apartments } from "@/data/content"
import { AvailabilityCalendar } from "./availability-calendar"
import { useReservation } from "./ClientChrome"

const inputClass = "w-full rounded-[2px] border border-mid/20 bg-pale px-4 py-[0.85rem] font-jost text-[0.9rem] text-dark outline-none transition-colors duration-200 focus:border-dark"
const labelClass = "mb-2 block text-[0.7rem] uppercase tracking-[0.16em] text-mid"
const buttonClass = "cursor-pointer rounded-[2px] border-none bg-dark px-10 py-[0.9rem] text-[0.78rem] font-medium uppercase tracking-[0.18em] text-cream transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"

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
  const t = useTranslations("contactForm")
  const locale = useLocale()
  const [status, setStatus] = useState(null)
  const loading = status?.type === "loading"

  async function handleSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    setStatus({ type: "loading", message: t("sending") })
    const data = { ...Object.fromEntries(new FormData(form).entries()), locale }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      const payload = await response.json()

      if (!response.ok) {
        setStatus({ type: "error", message: payload.error || t("errorGeneric") })
        return
      }

      form.reset()
      setStatus({ type: "success", message: payload.message || t("success") })
    } catch {
      setStatus({ type: "error", message: t("errorNetwork") })
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <StatusMessage status={status} />

      <div>
        <label htmlFor="contact-name" className={labelClass}>{t("nameLabel")}</label>
        <input id="contact-name" name="name" required placeholder={t("namePlaceholder")} className={inputClass} />
      </div>

      <div>
        <label htmlFor="contact-email" className={labelClass}>{t("emailLabel")}</label>
        <input id="contact-email" name="email" type="email" required placeholder={t("emailPlaceholder")} className={inputClass} />
      </div>

      <div>
        <label htmlFor="contact-phone" className={labelClass}>{t("phoneLabel")}</label>
        <input id="contact-phone" name="phone" type="tel" placeholder={t("phonePlaceholder")} className={inputClass} />
      </div>

      <div>
        <label htmlFor="contact-body" className={labelClass}>{t("messageLabel")}</label>
        <textarea id="contact-body" name="body" rows={6} required placeholder={t("messagePlaceholder")} className={`${inputClass} resize-y`} />
      </div>

      <button type="submit" disabled={loading} className={buttonClass}>
        {t("submit")}
      </button>
    </form>
  )
}

const SLOW_SUBMIT_NOTICE_DELAY_MS = 2000
const SUCCESS_ANIMATION_DELAY_MS = 900

export function ReservationForm() {
  const t = useTranslations("reservationForm")
  const locale = useLocale()
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
      setStatus({ type: "error", message: t("errorMissingDates") })
      return
    }

    const form = event.currentTarget
    const data = { ...Object.fromEntries(new FormData(form).entries()), locale }

    setStatus({ type: "submitting", message: t("statusSubmitting") })

    const slowNoticeTimer = setTimeout(() => {
      setStatus((current) =>
        current?.type === "submitting"
          ? { type: "submitting", message: t("statusSubmittingSlow") }
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
        setStatus({ type: "error", message: payload.error || t("errorGeneric") })
        return
      }
    } catch {
      clearTimeout(slowNoticeTimer)
      setStatus({ type: "error", message: t("errorNetwork") })
      return
    }

    clearTimeout(slowNoticeTimer)
    setStatus({ type: "success", message: t("statusSuccess") })

    setTimeout(() => {
      closeReservation()
      router.push(`/rezervace-vytvorena?token=${payload.reservationToken}`)
    }, SUCCESS_ANIMATION_DELAY_MS)
  }

  const buttonLabel = isSubmitting ? t("submitting") : isSuccess ? t("done") : t("submit")

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <StatusMessage status={status} />

      <fieldset disabled={isBusy} className="m-0 space-y-5 border-0 p-0">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="reservation-name" className={labelClass}>{t("nameLabel")}</label>
            <input id="reservation-name" name="name" required placeholder={t("namePlaceholder")} className={inputClass} />
          </div>
          <div>
            <label htmlFor="reservation-email" className={labelClass}>{t("emailLabel")}</label>
            <input id="reservation-email" name="email" type="email" required placeholder={t("emailPlaceholder")} className={inputClass} />
          </div>
          <div>
            <label htmlFor="reservation-phone" className={labelClass}>{t("phoneLabel")}</label>
            <input id="reservation-phone" name="phone" type="tel" placeholder={t("phonePlaceholder")} className={inputClass} />
          </div>
          <div>
            <label htmlFor="reservation-apartment" className={labelClass}>{t("apartmentLabel")}</label>
            <select
              id="reservation-apartment"
              name="apartment_selection"
              required
              className={inputClass}
              value={apartmentSelection}
              onChange={(event) => setApartmentSelection(event.target.value)}
            >
              <option value="">{t("apartmentPlaceholder")}</option>
              <option value="any">{t("apartmentAny")}</option>
              {apartments.map((apartment) => (
                <option key={apartment.slug} value={apartment.slug}>
                  {apartment.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>{t("datesLabel")}</label>
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
          <label htmlFor="reservation-guests" className={labelClass}>{t("guestsLabel")}</label>
          <input id="reservation-guests" name="guests" type="number" min="1" required placeholder={t("guestsPlaceholder")} className={inputClass} />
        </div>

        <div>
          <label htmlFor="reservation-note" className={labelClass}>{t("noteLabel")}</label>
          <textarea id="reservation-note" name="note" rows={4} placeholder={t("notePlaceholder")} className={`${inputClass} resize-y`} />
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
