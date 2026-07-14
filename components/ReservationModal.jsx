"use client"

import { useTranslations } from "next-intl"
import { businessContact } from "@/data/content"

const rowClass =
  "flex items-center gap-4 rounded-[2px] border border-mid/20 bg-pale px-5 py-4 transition-colors duration-200 hover:border-dark"

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 fill-none stroke-current stroke-[1.6] text-accent">
      <path d="M4 5c0 8.284 6.716 15 15 15a2 2 0 0 0 2-2v-2.5a1 1 0 0 0-.757-.97l-3.5-.875a1 1 0 0 0-1.06.39l-.86 1.146a11.03 11.03 0 0 1-4.554-4.554l1.147-.86a1 1 0 0 0 .39-1.06l-.876-3.5A1 1 0 0 0 8.5 4H6a2 2 0 0 0-2 2Z" strokeLinejoin="round" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 fill-none stroke-current stroke-[1.6] text-accent">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" strokeLinejoin="round" />
    </svg>
  )
}

export default function ReservationModal({ open, onClose }) {
  const t = useTranslations("booking")
  const form = useTranslations("reservationForm")
  const labels = useTranslations("labels")

  if (!open) return null

  const telHref = `tel:${businessContact.phone.replace(/\s/g, "")}`

  return (
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center bg-dark/70 px-4 py-8"
      aria-modal="true"
      role="dialog"
      aria-labelledby="reservation-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-[480px] bg-cream p-7 shadow-[0_24px_80px_rgba(51,51,51,0.24)] md:p-10">
        <button
          type="button"
          className="absolute right-5 top-4 text-3xl font-light leading-none text-mid transition-colors hover:text-dark"
          aria-label={form("close")}
          onClick={onClose}
        >
          ×
        </button>

        <div className="mb-7 pr-8">
          <p className="mb-2 text-[0.68rem] font-normal uppercase tracking-[0.3em] text-mid">{form("eyebrow")}</p>
          <h2 id="reservation-title" className="font-serif text-[clamp(1.8rem,4vw,2.4rem)] font-normal leading-[1.2] text-dark">
            {t("title")}
          </h2>
          <div className="mt-5 h-px w-10 bg-light" />
        </div>

        <p className="mb-7 text-[0.92rem] leading-relaxed text-mid">{t("intro")}</p>

        <div className="space-y-3">
          <a href={telHref} className={rowClass}>
            <PhoneIcon />
            <span>
              <span className="block text-[0.62rem] uppercase tracking-[0.2em] text-mid">{labels("phone")}</span>
              <span className="text-[1.05rem] text-dark">{businessContact.phone}</span>
            </span>
          </a>

          <a href={`mailto:${businessContact.email}`} className={rowClass}>
            <MailIcon />
            <span className="min-w-0">
              <span className="block text-[0.62rem] uppercase tracking-[0.2em] text-mid">{labels("email")}</span>
              <span className="block truncate text-[1.05rem] text-dark">{businessContact.email}</span>
            </span>
          </a>
        </div>

        <a
          href={businessContact.bookingUrl}
          target="_blank"
          rel="noopener"
          className="mt-6 flex w-full items-center justify-center rounded-[2px] bg-dark px-8 py-[0.95rem] text-[0.78rem] font-medium uppercase tracking-[0.18em] text-cream transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent"
        >
          {t("bookingCta")}
        </a>
      </div>
    </div>
  )
}
