import { ContactForm } from "@/components/forms"
import { MapEmbed, PageHero } from "@/components/ui"

export const metadata = {
  title: "Kontakt a rezervace",
  description: "Kontaktujte Spim na Rabí a rezervujte si studio nebo loft pod hradem Rabí. Rabí 175, Pošumaví.",
  alternates: { canonical: "/kontakt" }
}

export default function ContactPage() {
  return (
    <>
      <PageHero label="Jsme tu pro vás" title="Kontakt" />

      <section className="py-24 md:py-[100px]">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="grid grid-cols-1 gap-20 md:grid-cols-2">
            <div className="space-y-8 js-fade-in">
              <div>
                <p className="mb-1 text-[0.65rem] uppercase tracking-[0.22em] text-mid">Email</p>
                <p className="font-serif text-xl text-dark">
                  <a href="mailto:spimnarabi@seznam.cz" className="transition-colors hover:text-accent">spimnarabi@seznam.cz</a>
                </p>
              </div>

              <div>
                <p className="mb-1 text-[0.65rem] uppercase tracking-[0.22em] text-mid">Telefon</p>
                <p className="font-serif text-xl text-dark">
                  <a href="tel:+420723936426" className="transition-colors hover:text-accent">+420 723 936 426</a>
                </p>
              </div>

              <div>
                <p className="mb-1 text-[0.65rem] uppercase tracking-[0.22em] text-mid">Adresa</p>
                <p className="font-serif text-xl leading-snug text-dark">Rabí 175<br />342 01 Rabí</p>
              </div>

              <MapEmbed />
            </div>

            <div className="js-fade-in">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
