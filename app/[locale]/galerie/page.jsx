import { getTranslations, setRequestLocale } from "next-intl/server"
import { studioPhotos } from "@/data/content"
import { PageHero } from "@/components/ui"
import GalleryGrid from "@/components/gallery-grid"
import { buildAlternates } from "@/lib/seo"

export async function generateMetadata({ params }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "meta" })

  return {
    title: t("gallery.title"),
    description: t("gallery.description"),
    alternates: buildAlternates(locale, "/galerie")
  }
}

export default async function GalleryPage({ params }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("gallery")

  const photos = studioPhotos.map((src, i) => ({ src, alt: t("photoAlt", { n: i + 1 }) }))
  const labels = { close: t("close"), prev: t("prev"), next: t("next") }

  return (
    <>
      <PageHero label={t("heroLabel")} title={t("heroTitle")} />

      <section className="py-24 md:py-[100px]">
        <div className="mx-auto max-w-[1100px] px-8 js-fade-in">
          <GalleryGrid photos={photos} labels={labels} />
        </div>
      </section>
    </>
  )
}
