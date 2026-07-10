import { getTranslations, setRequestLocale } from "next-intl/server"
import { ContactForm } from "@/components/forms"
import { MapEmbed, PageHero } from "@/components/ui"
import { buildAlternates } from "@/lib/seo"

export async function generateMetadata({ params }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "meta" })

  return {
    title: t("contact.title"),
    description: t("contact.description"),
    alternates: buildAlternates(locale, "/kontakt")
  }
}

export default async function ContactPage({ params }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("contact")

  return (
    <>
      <PageHero label={t("heroLabel")} title={t("heroTitle")} />

      <section className="py-24 md:py-[100px]">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="grid grid-cols-1 gap-20 md:grid-cols-2">
            <div className="space-y-8 js-fade-in">
              <div>
                <p className="mb-1 text-[0.65rem] uppercase tracking-[0.22em] text-mid">{t("emailLabel")}</p>
                <p className="font-serif text-xl text-dark">
                  <a href="mailto:spimnarabi@seznam.cz" className="transition-colors hover:text-accent">spimnarabi@seznam.cz</a>
                </p>
              </div>

              <div>
                <p className="mb-1 text-[0.65rem] uppercase tracking-[0.22em] text-mid">{t("phoneLabel")}</p>
                <p className="font-serif text-xl text-dark">
                  <a href="tel:+420723936426" className="transition-colors hover:text-accent">+420 723 936 426</a>
                </p>
              </div>

              <div>
                <p className="mb-1 text-[0.65rem] uppercase tracking-[0.22em] text-mid">{t("addressLabel")}</p>
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
