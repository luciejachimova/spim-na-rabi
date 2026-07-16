"use client"

import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"

// Full-screen photo lightbox, controlled via `index` (null = closed). Shared by
// the gallery grid and the apartment cards. Arrow keys / on-screen arrows
// navigate, Escape or click-outside closes, with a counter.
export default function Lightbox({ photos, index, onClose, onIndexChange, labels }) {
  const open = index !== null && index >= 0
  const [visible, setVisible] = useState(false)

  const show = useCallback(
    (next) => {
      if (photos.length) onIndexChange((next + photos.length) % photos.length)
    },
    [photos.length, onIndexChange]
  )

  useEffect(() => {
    if (!open) {
      setVisible(false)
      return
    }
    const id = requestAnimationFrame(() => setVisible(true))
    const onKey = (event) => {
      if (event.key === "Escape") onClose()
      else if (event.key === "ArrowRight") show(index + 1)
      else if (event.key === "ArrowLeft") show(index - 1)
    }
    document.addEventListener("keydown", onKey)
    document.documentElement.classList.add("overflow-hidden")
    return () => {
      cancelAnimationFrame(id)
      document.removeEventListener("keydown", onKey)
      document.documentElement.classList.remove("overflow-hidden")
    }
  }, [open, index, show, onClose])

  if (!open || typeof document === "undefined") return null
  const photo = photos[index]

  // Portal to <body> so the overlay covers the full viewport regardless of any
  // transformed/overflow-hidden ancestor (e.g. the apartment card).
  return createPortal(
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-dark/90 px-4 py-6 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={labels.close}
        className="absolute right-5 top-4 text-4xl font-light leading-none text-cream/80 transition-colors hover:text-cream"
      >
        ×
      </button>

      {photos.length > 1 && (
        <button
          type="button"
          onClick={() => show(index - 1)}
          aria-label={labels.prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 px-3 py-4 text-4xl font-light text-cream/70 transition-colors hover:text-cream md:left-6"
        >
          ‹
        </button>
      )}

      <figure className="max-h-full max-w-[1100px]">
        <img src={photo.src} alt={photo.alt} className="mx-auto max-h-[82vh] w-auto max-w-full object-contain" />
        {photos.length > 1 && (
          <figcaption className="mt-3 text-center text-[0.75rem] uppercase tracking-[0.18em] text-cream/60">
            {index + 1} / {photos.length}
          </figcaption>
        )}
      </figure>

      {photos.length > 1 && (
        <button
          type="button"
          onClick={() => show(index + 1)}
          aria-label={labels.next}
          className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-4 text-4xl font-light text-cream/70 transition-colors hover:text-cream md:right-6"
        >
          ›
        </button>
      )}
    </div>,
    document.body
  )
}
