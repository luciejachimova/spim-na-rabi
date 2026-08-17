"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useReservation } from "./ClientChrome"
import Lightbox from "./lightbox"
import ApartmentDetailModal from "./apartment-detail-modal"

export function PhotoPlaceholder({ className = "", label }) {
  return (
    <div
      className={`flex items-center justify-center border border-mid/20 bg-pale text-center ${className}`}
      role="img"
      aria-label={label}
    >
      <div className="px-6">
        <div className="mx-auto mb-4 h-8 w-10 rounded-sm border border-accent/50">
          <div className="mx-auto mt-[7px] h-3.5 w-3.5 rounded-full border border-accent/50" />
        </div>
        {label ? (
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-mid">{label}</p>
        ) : null}
      </div>
    </div>
  )
}

export function SectionHeader({ label, title, body, align = "left" }) {
  const centered = align === "center"

  return (
    <div className={centered ? "text-center" : ""}>
      <p className="mb-2 text-[0.68rem] font-normal uppercase tracking-[0.3em] text-mid">{label}</p>
      <h2 className="mb-4 font-serif text-[clamp(2rem,4vw,2.8rem)] font-normal leading-[1.2]">{title}</h2>
      <div className={`mb-8 h-px w-10 bg-light ${centered ? "mx-auto" : ""}`} />
      {body ? (
        <p className={`max-w-[540px] text-[0.95rem] leading-relaxed text-mid ${centered ? "mx-auto" : ""}`}>
          {body}
        </p>
      ) : null}
    </div>
  )
}

export function PageHero({ label, title }) {
  return (
    <section className="relative flex min-h-[380px] items-center justify-center overflow-hidden border-b border-mid/10 bg-pale px-8 pt-[68px] text-center">
      <img
        src="/images/hero-rabi-lineart.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-8 left-1/2 w-[840px] max-w-[92vw] -translate-x-1/2 opacity-[0.08] md:bottom-10"
      />
      <div className="relative z-10">
        {label ? (
          <p className="mb-4 text-[0.72rem] uppercase tracking-[0.3em] text-mid">{label}</p>
        ) : null}
        <h1 className="font-serif text-[clamp(2.8rem,7vw,5rem)] font-light leading-[1.08] text-dark">{title}</h1>
      </div>
    </section>
  )
}

export function ApartmentCard({ apartment }) {
  const t = useTranslations()
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const hasPhotos = Array.isArray(apartment.photos) && apartment.photos.length > 0
  const photos = hasPhotos
    ? apartment.photos.map((src, i) => ({ src, alt: t("gallery.photoAlt", { name: apartment.name, n: i + 1 }) }))
    : []
  const lightboxLabels = { close: t("gallery.close"), prev: t("gallery.prev"), next: t("gallery.next") }
  // Open the lightbox on the photo shown in the card preview.
  const previewIndex = hasPhotos ? Math.max(0, apartment.photos.indexOf(apartment.imageUrl)) : 0

  const detailButtonClass =
    "inline-block cursor-pointer rounded-[2px] border border-dark px-[1.6rem] py-[0.65rem] text-[0.72rem] font-medium uppercase tracking-[0.18em] text-dark transition-colors duration-200 hover:bg-dark hover:text-cream"

  return (
    <div className="group overflow-hidden border border-mid/20 bg-cream transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(51,51,51,0.10)] js-fade-in">
      <div className="overflow-hidden">
        {hasPhotos ? (
          <button
            type="button"
            onClick={() => setLightboxIndex(previewIndex)}
            aria-label={apartment.name}
            className="group/photo relative block w-full cursor-pointer overflow-hidden"
          >
            <img
              src={apartment.imageUrl}
              alt={apartment.name}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-dark/0 opacity-0 transition-all duration-300 group-hover/photo:bg-dark/25 group-hover/photo:opacity-100">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-9 w-9 fill-none stroke-cream stroke-[1.5]">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                <path d="M11 8v6M8 11h6" strokeLinecap="round" />
              </svg>
            </span>
          </button>
        ) : (
          <PhotoPlaceholder
            className="aspect-[4/3] w-full transition-colors duration-300 group-hover:bg-cream"
            label={t("ui.photoPlaceholder")}
          />
        )}
      </div>
      <div className="p-8 pb-9">
        <p className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.22em] text-accent">
          {t(`apartments.${apartment.slug}.badge`)}
        </p>
        <h3 className="mb-2 font-serif text-[1.55rem] font-normal">{apartment.name}</h3>
        <p className="mb-6 text-[0.88rem] leading-[1.65] text-mid">{t(`apartments.${apartment.slug}.desc`)}</p>
        {apartment.hasDetail ? (
          <button type="button" onClick={() => setDetailOpen(true)} className={detailButtonClass}>
            {t("ui.viewDetail")}
          </button>
        ) : (
          <Link href="/cenik" className={detailButtonClass}>
            {t("ui.viewDetail")}
          </Link>
        )}
      </div>

      {hasPhotos && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
          labels={lightboxLabels}
        />
      )}
      {apartment.hasDetail && (
        <ApartmentDetailModal open={detailOpen} onClose={() => setDetailOpen(false)} apartment={apartment} />
      )}
    </div>
  )
}

export function ReviewCard({ text, author }) {
  return (
    <div className="relative border border-mid/15 bg-pale p-9 js-fade-in">
      <span className="absolute left-6 top-5 font-serif text-[3.5rem] italic leading-none text-light">"</span>
      <p className="mt-6 font-serif text-[1.05rem] font-normal italic leading-[1.7] text-dark">{text}</p>
      <div className="mt-5 text-[0.8rem] tracking-[0.1em] text-accent">★★★★★</div>
      <p className="mt-2 text-[0.72rem] uppercase tracking-[0.14em] text-mid">{author}</p>
    </div>
  )
}

export function MapEmbed({ title = "Rabí 175, 342 01 Rabí" }) {
  return (
    <iframe
      className="aspect-[4/3] w-full border-0 grayscale-[30%] contrast-[1.05]"
      src="https://www.google.com/maps?q=Rab%C3%AD%20175%2C%20342%2001%20Rab%C3%AD%2C%20Czechia&z=17&output=embed"
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      title={title}
    />
  )
}

export function CtaBanner({ label, title, ctaText }) {
  const { openReservation } = useReservation()

  return (
    <div className="relative overflow-hidden bg-dark px-8 py-28 text-center text-cream">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(232,225,215,0.16),transparent_55%)] opacity-[0.35]" />
      <div className="relative z-10">
        <p className="mb-5 text-[0.68rem] uppercase tracking-[0.3em] opacity-50">{label}</p>
        <h2 className="mx-auto mb-10 max-w-[600px] font-serif text-[clamp(1.8rem,4vw,2.8rem)] font-light leading-[1.3]">
          {title}
        </h2>
        <button
          type="button"
          onClick={openReservation}
          className="inline-block cursor-pointer rounded-[2px] border border-cream/60 px-10 py-[0.9rem] text-[0.78rem] font-medium uppercase tracking-[0.2em] text-cream transition-colors duration-200 hover:bg-cream hover:text-dark"
        >
          {ctaText}
        </button>
      </div>
    </div>
  )
}

export function PriceCard({ apartment }) {
  const t = useTranslations()

  return (
    <div className="border border-mid/20 bg-pale p-8 js-fade-in">
      <p className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.22em] text-accent">
        {t(`apartments.${apartment.slug}.badge`)}
      </p>
      <h3 className="mb-1 font-serif text-[1.65rem] font-normal">{apartment.name}</h3>
      <p className="mb-8 text-[0.86rem] text-mid">{t(`pricing.cards.${apartment.slug}.subtitle`)}</p>
      <div className="border-t border-mid/10 pt-6">
        <strong className="font-serif text-[1.9rem] font-normal leading-none text-dark">
          {t(`pricing.cards.${apartment.slug}.price`)}
        </strong>
        <p className="mt-3 text-[0.8rem] leading-relaxed text-mid">
          {t(`pricing.cards.${apartment.slug}.singleNight`)}
        </p>
      </div>
    </div>
  )
}
