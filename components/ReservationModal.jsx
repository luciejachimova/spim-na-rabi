"use client"

import { useTranslations } from "next-intl"
import { ReservationForm } from "./forms"

export default function ReservationModal({ open, onClose }) {
  const t = useTranslations("reservationForm")

  if (!open) return null

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
      <div className="relative max-h-[92vh] w-full max-w-[720px] overflow-y-auto bg-cream p-7 shadow-[0_24px_80px_rgba(51,51,51,0.24)] md:p-10">
        <button
          type="button"
          className="absolute right-5 top-4 text-3xl font-light leading-none text-mid transition-colors hover:text-dark"
          aria-label={t("close")}
          onClick={onClose}
        >
          ×
        </button>

        <div className="mb-8 pr-8">
          <p className="mb-2 text-[0.68rem] font-normal uppercase tracking-[0.3em] text-mid">{t("eyebrow")}</p>
          <h2 id="reservation-title" className="font-serif text-[clamp(2rem,4vw,2.8rem)] font-normal leading-[1.2] text-dark">
            {t("title")}
          </h2>
          <div className="mt-5 h-px w-10 bg-light" />
        </div>

        <ReservationForm />
      </div>
    </div>
  )
}
