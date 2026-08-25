import { getTranslations, setRequestLocale } from "next-intl/server"
import { apartments } from "@/data/content"
import { PageHero, PriceCard } from "@/components/ui"
import { buildAlternates } from "@/lib/seo"

export async function generateMetadata({ params }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "meta" })

  return {
    title: t("pricing.title"),
    description: t("pricing.description"),
    alternates: buildAlternates(locale, "/cenik")
  }
}

export default async function PricingPage({ params }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("pricing")

  return (
    <>
      <PageHero title={t("heroTitle")} />

      <section className="py-24 md:py-[100px]">
        <div className="mx-auto max-w-[1100px] px-8">
          <ul className="mb-16 max-w-xl divide-y divide-mid/10 border-y border-mid/10 text-[0.95rem] leading-relaxed text-mid js-fade-in">
            {t.raw("notes").map((note) => (
              <li key={note} className="py-3">
                {note}
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {apartments.map((apartment) => (
              <PriceCard key={apartment.slug} apartment={apartment} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
