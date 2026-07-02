import { priceCards } from "@/data/content"
import { PageHero, PriceCard } from "@/components/ui"

export const metadata = {
  title: "Ceník ubytování",
  description: "Ceník ubytování Spim na Rabí. Studio až pro 4 osoby a loft až pro 6 osob od 1 900 Kč za noc.",
  alternates: { canonical: "/cenik" }
}

export default function PricingPage() {
  return (
    <>
      <PageHero label="Transparentní ceny" title="Ceník" />

      <section className="py-24 md:py-[100px]">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="mb-16 max-w-xl js-fade-in">
            <p className="text-[0.95rem] leading-relaxed text-mid">
              Minimální délka pobytu jsou 2 noci. Na přání pro vás rádi připravíme snídani. Domácí mazlíčci jsou vítáni za poplatek 250 Kč / noc.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {priceCards.map((card) => (
              <PriceCard key={card.badge} card={card} />
            ))}
          </div>

        </div>
      </section>
    </>
  )
}
