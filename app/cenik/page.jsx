import { priceCards } from "@/data/content"
import { PageHero, PriceCard } from "@/components/ui"

export const metadata = {
  title: "Ceník"
}

export default function PricingPage() {
  return (
    <>
      <PageHero label="Transparentní ceny" title="Ceník" />

      <section className="py-24 md:py-[100px]">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="mb-16 max-w-xl js-fade-in">
            <p className="text-[0.95rem] leading-relaxed text-mid">
              Transparentní ceny bez překvapení. Cena zahrnuje ubytování, základní vybavení a přístup ke všem společným prostorám.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {priceCards.map((card) => (
              <PriceCard key={card.badge} card={card} />
            ))}
          </div>

          <div className="my-12 text-center font-serif text-xl tracking-[0.4em] text-light opacity-60">· · ·</div>
          <p className="text-center text-[0.82rem] text-mid">
            Minimální délka pobytu: 2 noci. Snídaně na vyžádání. Úklidový poplatek 350 Kč jednorázově.
          </p>
        </div>
      </section>
    </>
  )
}
