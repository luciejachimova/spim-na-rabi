import { getTranslations, setRequestLocale } from "next-intl/server"
import { galleryImageCount } from "@/data/content"
import { PageHero, PhotoPlaceholder } from "@/components/ui"
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
  const ui = await getTranslations("ui")

  return (
    <>
      <PageHero label={t("heroLabel")} title={t("heroTitle")} />

      <section className="py-24 md:py-[100px]">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 js-fade-in">
            {Array.from({ length: galleryImageCount }).map((_, index) => (
              <div key={index} className="group mb-5 break-inside-avoid overflow-hidden">
                <PhotoPlaceholder
                  className={`${index % 3 === 1 ? "aspect-[3/4]" : "aspect-[4/3]"} w-full transition-colors duration-300 group-hover:bg-cream`}
                  label={ui("photoPlaceholder")}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
