import { galleryImages } from "@/data/content"
import { PageHero, PhotoPlaceholder } from "@/components/ui"

export const metadata = {
  title: "Galerie"
}

export default function GalleryPage() {
  return (
    <>
      <PageHero label="Podívejte se" title="Galerie" />

      <section className="py-24 md:py-[100px]">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 js-fade-in">
            {galleryImages.map((image, index) => (
              <div key={image.src} className="group mb-5 break-inside-avoid overflow-hidden">
                <PhotoPlaceholder
                  className={`${index % 3 === 1 ? "aspect-[3/4]" : "aspect-[4/3]"} w-full transition-colors duration-300 group-hover:bg-cream`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
