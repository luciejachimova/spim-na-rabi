import Link from "next/link"
import { PageHero, PhotoPlaceholder } from "@/components/ui"

export const metadata = {
  title: "O nás",
  description: "Poznejte příběh ubytování Spim na Rabí a naši filozofii klidného pobytu pod hradem Rabí.",
  alternates: { canonical: "/o-nas" }
}

export default function AboutPage() {
  return (
    <>
      <PageHero label="Náš příběh" title="O nás" />

      <section className="py-24 md:py-[100px]">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="grid grid-cols-1 items-center gap-20 md:grid-cols-2">
            <div className="js-fade-in">
              <PhotoPlaceholder className="aspect-[3/4] w-full" />
            </div>

            <div className="js-fade-in">
              <p className="mb-2 text-[0.68rem] font-normal uppercase tracking-[0.3em] text-mid">Náš příběh</p>
              <h2 className="mb-4 font-serif text-[clamp(2rem,4vw,2.8rem)] font-normal leading-[1.2]">
                Jak vzniklo Spim na Rabí?
              </h2>
              <div className="mb-8 h-px w-10 bg-light" />

              <div className="space-y-5 text-[0.95rem] leading-[1.8] text-mid">
                <p>Rabí a jeho okolí jsou pro nás místem, ke kterému máme blízko už od dětství. Právě tady jsme strávili spoustu krásných chvil a vždy jsme se sem rádi vraceli.</p>
                <p>Když jsme přemýšleli, kde vytvořit místo pro odpočinek, bylo rozhodnutí vlastně jednoduché. Chtěli jsme nabídnout ubytování, kde se budou hosté cítit příjemně, zpomalí a budou mít ideální výchozí bod pro objevování krás Šumavy a Pošumaví.</p>
                <p>Spim na Rabí jsme zařídili tak, jak bychom si přáli cestovat i my sami – pohodlně, útulně a bez zbytečností. Budeme rádi, když si pobyt u nás užijete a odvezete si domů stejně hezké vzpomínky, jaké máme s tímto místem my.</p>
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
