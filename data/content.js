// Structural (non-textual) content only. All user-facing text lives in the
// message catalogs under /messages and is looked up by the keys/slugs below.

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

// Brand names are locale-independent; badge/desc/subtitle come from the
// "apartments" and "pricing" message namespaces keyed by slug. imageUrl is the
// card photo, or null to fall back to a placeholder (Loft ¹⁰ has no photos yet).
export const apartments = [
  {
    slug: "studio-3",
    name: "Studio ³",
    imageUrl: studioPhotos[0]
  },
  {
    slug: "loft-10",
    name: "Loft ¹⁰",
    imageUrl: null
  }
]
