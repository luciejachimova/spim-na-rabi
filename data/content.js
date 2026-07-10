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

// Brand names and images are locale-independent; badge/desc/subtitle come from
// the "apartments" and "pricing" message namespaces keyed by slug.
export const apartments = [
  {
    slug: "studio-3",
    name: "Studio ³",
    imageUrl: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80"
  },
  {
    slug: "loft-10",
    name: "Loft ¹⁰",
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80"
  }
]

// Number of placeholder tiles rendered on the gallery page.
export const galleryImageCount = 9
