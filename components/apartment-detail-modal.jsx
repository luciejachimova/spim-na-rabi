"use client"

import { useTranslations } from "next-intl"
import Modal from "./modal"

// Apartment detail dialog: name, short description, and amenity groups. Content
// (description + groups of { icon, heading, items }) comes from the
// "apartmentDetail.<slug>" message namespace. Reused for every apartment.
export default function ApartmentDetailModal({ open, onClose, apartment }) {
  const t = useTranslations()
  const base = `apartmentDetail.${apartment.slug}`
  const groups = open ? t.raw(`${base}.groups`) : []

  return (
    <Modal open={open} onClose={onClose} labelledBy="apartment-detail-title" className="w-full max-w-[640px]">
      <div className="relative max-h-[88vh] w-full overflow-y-auto bg-cream p-7 shadow-[0_24px_80px_rgba(51,51,51,0.24)] md:p-10">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("gallery.close")}
          className="absolute right-5 top-4 text-3xl font-light leading-none text-mid transition-colors hover:text-dark"
        >
          ×
        </button>

        <div className="mb-6 pr-8">
          <p className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.22em] text-accent">
            {t(`apartments.${apartment.slug}.badge`)}
          </p>
          <h2 id="apartment-detail-title" className="font-serif text-[clamp(1.9rem,4vw,2.6rem)] font-normal leading-[1.15] text-dark">
            {apartment.name}
          </h2>
          <div className="mt-5 h-px w-10 bg-light" />
        </div>

        <p className="mb-9 text-[0.95rem] leading-[1.75] text-mid">{t(`${base}.description`)}</p>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          {groups.map((group) => (
            <div key={group.heading}>
              <h3 className="mb-3 flex items-center gap-2 text-[0.95rem] font-medium text-dark">
                <span aria-hidden="true" className="text-[1.15rem]">
                  {group.icon}
                </span>
                {group.heading}
              </h3>
              <ul className="list-none space-y-1.5">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-2 text-[0.9rem] leading-snug text-mid">
                    <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent/70" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
