"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"

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
        <p className="mb-4 text-[0.72rem] uppercase tracking-[0.3em] text-mid">{label}</p>
        <h1 className="font-serif text-[clamp(2.8rem,7vw,5rem)] font-light leading-[1.08] text-dark">{title}</h1>
      </div>
    </section>
  )
}

export function ApartmentCard({ apartment }) {
  const t = useTranslations()

  return (
    <div className="group overflow-hidden border border-mid/20 bg-cream transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(51,51,51,0.10)] js-fade-in">
      <div className="overflow-hidden">
        <PhotoPlaceholder
          className="aspect-[4/3] w-full transition-colors duration-300 group-hover:bg-cream"
          label={t("ui.photoPlaceholder")}
        />
      </div>
      <div className="p-8 pb-9">
        <p className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.22em] text-accent">
          {t(`apartments.${apartment.slug}.badge`)}
        </p>
        <h3 className="mb-2 font-serif text-[1.55rem] font-normal">{apartment.name}</h3>
        <p className="mb-6 text-[0.88rem] leading-[1.65] text-mid">{t(`apartments.${apartment.slug}.desc`)}</p>
        <Link
          href="/cenik"
          className="inline-block rounded-[2px] border border-dark px-[1.6rem] py-[0.65rem] text-[0.72rem] font-medium uppercase tracking-[0.18em] text-dark transition-colors duration-200 hover:bg-dark hover:text-cream"
        >
          {t("ui.viewDetail")}
        </Link>
      </div>
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
  return (
    <div className="relative overflow-hidden bg-dark px-8 py-28 text-center text-cream">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(232,225,215,0.16),transparent_55%)] opacity-[0.35]" />
      <div className="relative z-10">
        <p className="mb-5 text-[0.68rem] uppercase tracking-[0.3em] opacity-50">{label}</p>
        <h2 className="mx-auto mb-10 max-w-[600px] font-serif text-[clamp(1.8rem,4vw,2.8rem)] font-light leading-[1.3]">
          {title}
        </h2>
        <Link
          href="/kontakt"
          className="inline-block rounded-[2px] border border-cream/60 px-10 py-[0.9rem] text-[0.78rem] font-medium uppercase tracking-[0.2em] text-cream transition-colors duration-200 hover:bg-cream hover:text-dark"
        >
          {ctaText}
        </Link>
      </div>
    </div>
  )
}

export function PriceCard({ apartment }) {
  const t = useTranslations()
  const seasons = t.raw(`pricing.cards.${apartment.slug}.seasons`)

  return (
    <div className="border border-mid/20 bg-pale p-8 js-fade-in">
      <p className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.22em] text-accent">
        {t(`apartments.${apartment.slug}.badge`)}
      </p>
      <h3 className="mb-1 font-serif text-[1.65rem] font-normal">{apartment.name}</h3>
      <p className="mb-8 text-[0.86rem] text-mid">{t(`pricing.cards.${apartment.slug}.subtitle`)}</p>
      <div className="space-y-4">
        {seasons.map((season) => (
          <div key={season.label} className="flex items-baseline justify-between gap-4 border-t border-mid/10 pt-4">
            <span className="text-sm leading-snug text-mid">{season.label}</span>
            <strong className="shrink-0 text-sm font-medium text-dark">{season.price}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}
