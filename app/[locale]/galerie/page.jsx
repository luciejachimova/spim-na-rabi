import { getTranslations, setRequestLocale } from "next-intl/server"
import { galleryByApartment } from "@/data/content"
import { PageHero, PhotoPlaceholder } from "@/components/ui"
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
  const ui = await getTranslations("ui")

  const labels = { close: t("close"), prev: t("prev"), next: t("next") }

  return (
    <>
      <PageHero label={t("heroLabel")} title={t("heroTitle")} />

      <section className="py-24 md:py-[100px]">
        <div className="mx-auto max-w-[1100px] px-8">
          {galleryByApartment.map((apartment, index) => (
            <div key={apartment.slug} className={`js-fade-in ${index > 0 ? "mt-24 md:mt-28" : ""}`}>
              <div className="mb-10 flex items-center gap-5">
                <h2 className="shrink-0 font-serif text-[clamp(1.6rem,3vw,2.2rem)] font-normal leading-none text-dark">
                  {apartment.name}
                </h2>
                <div className="h-px flex-1 bg-mid/15" />
              </div>

              {apartment.photos.length > 0 ? (
                <GalleryGrid
                  photos={apartment.photos.map((src, i) => ({
                    src,
                    alt: t("photoAlt", { name: apartment.name, n: i + 1 })
                  }))}
                  labels={labels}
                />
              ) : (
                <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="mb-5 break-inside-avoid">
                      <PhotoPlaceholder
                        className={`${i === 1 ? "aspect-[3/4]" : "aspect-[4/3]"} w-full`}
                        label={ui("photoPlaceholder")}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
