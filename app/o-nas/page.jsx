import Link from "next/link"
import { PageHero } from "@/components/ui"

export const metadata = {
  title: "O nás"
}

export default function AboutPage() {
  return (
    <>
      <PageHero label="Náš příběh" title="O nás" />

      <section className="py-24 md:py-[100px]">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="grid grid-cols-1 items-center gap-20 md:grid-cols-2">
            <div className="js-fade-in">
              <img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=85"
                alt="Krajina kolem Rabí"
                className="block aspect-[3/4] w-full object-cover"
              />
            </div>

            <div className="js-fade-in">
              <p className="mb-2 text-[0.68rem] font-normal uppercase tracking-[0.3em] text-mid">Naše filozofie</p>
              <h2 className="mb-4 font-serif text-[clamp(2rem,4vw,2.8rem)] font-normal leading-[1.2]">
                Vzniklo z lásky k tomuto místu
              </h2>
              <div className="mb-8 h-px w-10 bg-light" />

              <div className="space-y-5 text-[0.95rem] leading-[1.8] text-mid">
                <p>Spím na Rabí vzniklo z lásky k tomuto místu. Chtěli jsme vytvořit prostor, kde si lidé odpočinou, zpomalí a na chvíli vypnou.</p>
                <p>Věříme v jednoduchost, klid a atmosféru, kterou si odvezete s sebou. Každý detail v apartmánech je promyšlený tak, aby vás přivítal jako doma.</p>
                <p>Hrad Rabí nás fascinuje od dětství. Rozhodli jsme se, že toto místo budeme sdílet s těmi, kteří to ocení stejně jako my.</p>
              </div>

              <div className="mt-8">
                <Link href="/kontakt" className="inline-block rounded-[2px] border border-dark px-[1.6rem] py-[0.65rem] text-[0.72rem] font-medium uppercase tracking-[0.18em] text-dark transition-colors duration-200 hover:bg-dark hover:text-cream">
                  Kontaktujte nás
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
