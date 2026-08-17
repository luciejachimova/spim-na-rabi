// Structural (non-textual) content only. All user-facing text lives in the
// message catalogs under /messages and is looked up by the keys/slugs below.

// Contact / booking channels shown in the reservation dialog. Client-safe
// (plain data), so client components can import it directly.
export const businessContact = {
  phone: "+420 723 936 426",
  email: "spimnarabi@seznam.cz",
  bookingUrl: "https://www.booking.com/hotel/cz/spim-na-rabi-studio-3.cs.html"
}

// Guest reviews, quoted verbatim from where they were left. Not part of the
// message catalogs on purpose: a review is someone else's words, so it stays in
// the language it was written in on every locale of the site.
export const reviews = [
  {
    text: "Nádherné, čisté, fantastické ubytování. Krásná lokalita s úžasnou kavárnou hned vedle ubytování. Rádi se vrátíme.",
    author: "Radka H.",
    source: "Google",
    rating: 5
  }
]

export const navLinks = [
  { key: "home", href: "/" },
  { key: "about", href: "/o-nas" },
  { key: "gallery", href: "/galerie" },
  { key: "pricing", href: "/cenik" },
  { key: "contact", href: "/kontakt" }
]

// Legal/info pages, linked from the footer.
export const legalLinks = [
  { key: "gdpr", href: "/gdpr" },
  { key: "terms", href: "/podminky" },
  { key: "cancellation", href: "/storno" }
]

// Studio photos (web-optimized, stored under public/images/studio). Shown in
// the gallery and as the Studio ³ card image.
export const studioPhotos = Array.from(
  { length: 18 },
  (_, i) => `/images/studio/studio-${String(i + 1).padStart(2, "0")}.jpg`
)

// Loft photos (web-optimized, stored under public/images/loft). Shown in the
// gallery and as the Loft ¹⁰ card image.
export const loftPhotos = Array.from(
  { length: 13 },
  (_, i) => `/images/loft/loft-${String(i + 1).padStart(2, "0")}.jpg`
)

// Brand names are locale-independent; badge/desc/subtitle come from the
// "apartments" and "pricing" message namespaces keyed by slug. imageUrl is the
// card photo, or null to fall back to a placeholder.
export const apartments = [
  {
    slug: "studio-3",
    name: "Studio ³",
    imageUrl: studioPhotos[17],
    photos: studioPhotos,
    hasDetail: true
  },
  {
    slug: "loft-10",
    name: "Loft ¹⁰",
    imageUrl: loftPhotos[0] ?? null,
    photos: loftPhotos,
    hasDetail: true
  }
]

// Gallery, grouped per apartment. Each section renders its photos, or a
// "coming soon" placeholder when the apartment has none yet.
export const galleryByApartment = [
  { slug: "studio-3", name: "Studio ³", photos: studioPhotos },
  { slug: "loft-10", name: "Loft ¹⁰", photos: loftPhotos }
]
