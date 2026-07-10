import { getTranslations, setRequestLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { PageHero, PhotoPlaceholder } from "@/components/ui"
import { buildAlternates } from "@/lib/seo"

export async function generateMetadata({ params }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "meta" })

  return {
    title: t("about.title"),
    description: t("about.description"),
    alternates: buildAlternates(locale, "/o-nas")
  }
}

export default async function AboutPage({ params }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("about")
  const ui = await getTranslations("ui")

  return (
    <>
      <PageHero label={t("heroLabel")} title={t("heroTitle")} />

      <section className="py-24 md:py-[100px]">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="grid grid-cols-1 items-center gap-20 md:grid-cols-2">
            <div className="js-fade-in">
              <PhotoPlaceholder className="aspect-[3/4] w-full" label={ui("photoPlaceholder")} />
            </div>

            <div className="js-fade-in">
              <p className="mb-2 text-[0.68rem] font-normal uppercase tracking-[0.3em] text-mid">{t("sectionEyebrow")}</p>
              <h2 className="mb-4 font-serif text-[clamp(2rem,4vw,2.8rem)] font-normal leading-[1.2]">
                {t("sectionTitle")}
              </h2>
              <div className="mb-8 h-px w-10 bg-light" />

              <div className="space-y-5 text-[0.95rem] leading-[1.8] text-mid">
                <p>{t("p1")}</p>
                <p>{t("p2")}</p>
                <p>{t("p3")}</p>
              </div>

              <div className="mt-8">
                <Link href="/kontakt" className="inline-block rounded-[2px] border border-dark px-[1.6rem] py-[0.65rem] text-[0.72rem] font-medium uppercase tracking-[0.18em] text-dark transition-colors duration-200 hover:bg-dark hover:text-cream">
                  {t("cta")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
