"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { apartments } from "@/data/content"
import { ApartmentCard, CtaBanner, MapEmbed, SectionHeader } from "@/components/ui"
import { useReservation } from "@/components/ClientChrome"

export default function HomePage() {
  const t = useTranslations("home")
  const ui = useTranslations("ui")
  const { openReservation } = useReservation()

  return (
    <>
      <section id="hero" className="relative flex h-screen min-h-[600px] items-center justify-center overflow-hidden border-b border-mid/10 bg-cream">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#E8E1D7_0%,#F7F5F2_100%)]" />
        <img
          src="/images/hero-rabi-lineart.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-28 left-1/2 w-[1100px] max-w-[92vw] -translate-x-1/2 opacity-[0.09] md:bottom-32"
        />

        <div className="relative z-10 px-8 text-center text-dark">
          <p className="mb-5 animate-fade-up text-[0.75rem] font-normal uppercase tracking-[0.3em] text-mid [animation-delay:300ms]">
            {t("heroEyebrow")}
          </p>
          <h1 className="mb-4 animate-fade-up font-script text-[clamp(3rem,8vw,6rem)] leading-[1.05] [animation-delay:550ms]">
            Spim na Rabí
          </h1>
          <p className="mb-8 animate-fade-up font-serif text-[clamp(1.1rem,2.5vw,1.45rem)] font-light italic text-mid [animation-delay:750ms]">
            {t("heroSubtitle")}
          </p>
          <button
            type="button"
            onClick={openReservation}
            className="inline-block animate-fade-up cursor-pointer rounded-[2px] border-none bg-dark px-10 py-[0.9rem] text-[0.78rem] font-medium uppercase tracking-[0.2em] text-cream transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent [animation-delay:900ms]"
          >
            {t("heroCta")}
          </button>
        </div>

        <div className="absolute bottom-9 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 opacity-55">
          <span className="text-[0.65rem] uppercase tracking-[0.22em] text-mid">{t("scroll")}</span>
          <div className="h-11 w-px bg-mid/40 animate-scroll-pulse" />
        </div>
      </section>

      <div className="bg-dark px-8 py-14 text-center text-cream js-fade-in">
        <p className="mx-auto max-w-[680px] font-serif text-[clamp(1.1rem,2.2vw,1.35rem)] font-light italic leading-[1.75] opacity-90">
          {t("quote")}
        </p>
      </div>

      <section id="apartmany" className="bg-pale py-24 md:py-[100px]">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="js-fade-in">
            <SectionHeader
              label={t("apartmentsLabel")}
              title={t("apartmentsTitle")}
              body={t("apartmentsBody")}
            />
          </div>

          <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-2">
            {apartments.map((apartment) => (
              <ApartmentCard key={apartment.slug} apartment={apartment} />
            ))}
          </div>
        </div>
      </section>

      <section id="recenze" className="py-24 md:py-[100px]">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="js-fade-in">
            <SectionHeader label={t("reviewsLabel")} title={t("reviewsTitle")} align="center" />
          </div>

          <div className="mx-auto mt-16 max-w-[560px] text-center js-fade-in">
            <div className="text-[0.9rem] tracking-[0.25em] text-accent">★★★★★</div>
            <p className="mt-5 font-serif text-[clamp(1.2rem,2.4vw,1.6rem)] font-light italic leading-[1.5] text-dark">
              {t("reviewsInvite")}
            </p>
            <Link
              href="/kontakt"
              className="mt-8 inline-block rounded-[2px] border border-dark px-[1.6rem] py-[0.65rem] text-[0.72rem] font-medium uppercase tracking-[0.18em] text-dark transition-colors duration-200 hover:bg-dark hover:text-cream"
            >
              {t("locationCta")}
            </Link>
          </div>
        </div>
      </section>

      <section id="lokalita" className="bg-pale py-24 md:py-[100px]">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="grid grid-cols-1 items-start gap-20 md:grid-cols-2">
            <div className="js-fade-in">
              <SectionHeader
                label={t("locationLabel")}
                title={t("locationTitle")}
                body={t("locationBody")}
              />
              <div className="mt-6 text-sm text-mid">
                <strong className="mb-0.5 block font-medium text-dark">{t("locationAddressLabel")}</strong>
                {t("locationAddress")}
              </div>
              <div className="mt-6">
                <Link href="/kontakt" className="inline-block rounded-[2px] border border-dark px-[1.6rem] py-[0.65rem] text-[0.72rem] font-medium uppercase tracking-[0.18em] text-dark transition-colors duration-200 hover:bg-dark hover:text-cream">
                  {t("locationCta")}
                </Link>
              </div>
            </div>

            <div className="js-fade-in">
              <MapEmbed />
            </div>
          </div>
        </div>
      </section>

      <CtaBanner label={t("ctaLabel")} title={t("ctaTitle")} ctaText={ui("ctaBannerCta")} />
    </>
  )
}
