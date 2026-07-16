"use client"

import { useState } from "react"
import Lightbox from "./lightbox"

// Masonry gallery grid whose tiles open the shared Lightbox. Photos are passed
// in already localized ({ src, alt }).
export default function GalleryGrid({ photos, labels }) {
  const [index, setIndex] = useState(null)

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

      <Lightbox photos={photos} index={index} onClose={() => setIndex(null)} onIndexChange={setIndex} labels={labels} />
    </>
  )
}
