"use client"

import Link from "next/link"
import { apartments, reviews } from "@/data/content"
import { ApartmentCard, CtaBanner, MapEmbed, ReviewCard, SectionHeader } from "@/components/ui"
import { useReservation } from "@/components/ClientChrome"

export default function HomePage() {
  const reservation = useReservation()

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
            Ubytování v srdci Šumavy
          </p>
          <h1 className="mb-4 animate-fade-up font-script text-[clamp(3rem,8vw,6rem)] leading-[1.05] [animation-delay:550ms]">
            Spim na Rabí
          </h1>
          <p className="mb-7 animate-fade-up font-serif text-[clamp(1.1rem,2.5vw,1.45rem)] font-light italic text-mid [animation-delay:750ms]">
            Ubytování, kde se čas zpomalí
          </p>
          <p className="mb-8 animate-fade-up text-[0.68rem] font-medium uppercase tracking-[0.2em] text-accent [animation-delay:900ms]">
            Rezervace spuštěny <span aria-hidden="true" className="mx-2 text-light">·</span> Otevíráme v polovině července
          </p>
          <button
            type="button"
            className="inline-block animate-fade-up rounded-[2px] bg-dark px-10 py-[0.9rem] text-[0.78rem] font-medium uppercase tracking-[0.2em] text-cream transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent [animation-delay:1050ms]"
            onClick={() => reservation?.openReservation()}
          >
            Rezervovat pobyt
          </button>
        </div>

        <div className="absolute bottom-9 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 opacity-55">
          <span className="text-[0.65rem] uppercase tracking-[0.22em] text-mid">Scroll</span>
          <div className="h-11 w-px bg-mid/40 animate-scroll-pulse" />
        </div>
      </section>

      <div className="bg-dark px-8 py-14 text-center text-cream js-fade-in">
        <p className="mx-auto max-w-[680px] font-serif text-[clamp(1.1rem,2.2vw,1.35rem)] font-light italic leading-[1.75] opacity-90">
          Hrad Rabí na dosah, klid šumavské přírody a vzduch, který zpomalí každou myšlenku.
        </p>
      </div>

      <section id="apartmany" className="bg-pale py-24 md:py-[100px]">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="js-fade-in">
            <SectionHeader
              label="Ubytování"
              title="Naše apartmány"
              body="Dva pečlivě zařízené prostory, každý s vlastním charakterem. Oba s výhledem, klidem a vším, co k odpočinku potřebujete."
            />
          </div>

          <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-2">
            {apartments.map((apartment) => (
              <ApartmentCard key={apartment.name} apartment={apartment} />
            ))}
          </div>
        </div>
      </section>

      <section id="recenze" className="py-24 md:py-[100px]">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="js-fade-in">
            <SectionHeader label="Hosté říkají" title="Recenze" align="center" />
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard key={review.author} {...review} />
            ))}
          </div>
        </div>
      </section>

      <section id="lokalita" className="bg-pale py-24 md:py-[100px]">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="grid grid-cols-1 items-start gap-20 md:grid-cols-2">
            <div className="js-fade-in">
              <SectionHeader
                label="Kde nás najdete"
                title="Rabí"
                body="Malebné město na okraji Šumavy, kde se historie potkává s klidem přírody. Dominantou místa je majestátní hrad Rabí, jen pár minut od vašeho pobytu."
              />
              <div className="mt-6 text-sm text-mid">
                <strong className="mb-0.5 block font-medium text-dark">Adresa</strong>
                Rabí 175, 342 01 Rabí
              </div>
              <div className="mt-6">
                <Link href="/kontakt" className="inline-block rounded-[2px] border border-dark px-[1.6rem] py-[0.65rem] text-[0.72rem] font-medium uppercase tracking-[0.18em] text-dark transition-colors duration-200 hover:bg-dark hover:text-cream">
                  Napsat nám
                </Link>
              </div>
            </div>

            <div className="js-fade-in">
              <MapEmbed />
            </div>
          </div>
        </div>
      </section>

      <CtaBanner label="Připraveni zpomalit?" title="Rezervujte si pobyt a dopřejte si odpočinek pod hradem Rabí." />
    </>
  )
}
