import { galleryImages } from "@/data/content"
import { PageHero } from "@/components/ui"

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
            {galleryImages.map((image) => (
              <div key={image.src} className="group mb-5 break-inside-avoid overflow-hidden">
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  className="block w-full transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
