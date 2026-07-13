"use client"

import { useCallback, useEffect, useState } from "react"

// Masonry gallery with a full-screen lightbox (click to enlarge, arrow/keyboard
// navigation). Photos are passed in already localized ({ src, alt }).
export default function GalleryGrid({ photos, labels }) {
  const [index, setIndex] = useState(null)
  const isOpen = index !== null

  const close = useCallback(() => setIndex(null), [])
  const show = useCallback(
    (next) => setIndex((current) => (current === null ? current : (next + photos.length) % photos.length)),
    [photos.length]
  )

  useEffect(() => {
    if (!isOpen) return

    const onKey = (event) => {
      if (event.key === "Escape") close()
      else if (event.key === "ArrowRight") show(index + 1)
      else if (event.key === "ArrowLeft") show(index - 1)
    }
    document.addEventListener("keydown", onKey)
    document.documentElement.classList.add("overflow-hidden")

    return () => {
      document.removeEventListener("keydown", onKey)
      document.documentElement.classList.remove("overflow-hidden")
    }
  }, [isOpen, index, show, close])

  return (
    <>
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        {photos.map((photo, i) => (
          <button
            key={photo.src}
            type="button"
            onClick={() => setIndex(i)}
            className="group mb-5 block w-full cursor-pointer break-inside-avoid overflow-hidden bg-pale"
            aria-label={photo.alt}
          >
            <img
              src={photo.src}
              alt={photo.alt}
              loading="lazy"
              className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-dark/90 px-4 py-6"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close()
          }}
        >
          <button
            type="button"
            onClick={close}
            aria-label={labels.close}
            className="absolute right-5 top-4 text-4xl font-light leading-none text-cream/80 transition-colors hover:text-cream"
          >
            ×
          </button>

          <button
            type="button"
            onClick={() => show(index - 1)}
            aria-label={labels.prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 px-3 py-4 text-4xl font-light text-cream/70 transition-colors hover:text-cream md:left-6"
          >
            ‹
          </button>

          <figure className="max-h-full max-w-[1100px]">
            <img
              src={photos[index].src}
              alt={photos[index].alt}
              className="mx-auto max-h-[82vh] w-auto max-w-full object-contain"
            />
            <figcaption className="mt-3 text-center text-[0.75rem] uppercase tracking-[0.18em] text-cream/60">
              {index + 1} / {photos.length}
            </figcaption>
          </figure>

          <button
            type="button"
            onClick={() => show(index + 1)}
            aria-label={labels.next}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-4 text-4xl font-light text-cream/70 transition-colors hover:text-cream md:right-6"
          >
            ›
          </button>
        </div>
      )}
    </>
  )
}
