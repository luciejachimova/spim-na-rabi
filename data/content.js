export const navItems = [
  { label: "Hlavní stránka", href: "/" },
  { label: "O nás", href: "/o-nas" },
  { label: "Galerie", href: "/galerie" },
  { label: "Ceník", href: "/cenik" },
  { label: "Kontakt", href: "/kontakt" }
]

export const galleryImages = [
  { src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80", alt: "Útulný interiér apartmánu" },
  { src: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80", alt: "Ložnice s přírodním světlem" },
  { src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80", alt: "Obývací část apartmánu" },
  { src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80", alt: "Krajina v okolí Rabí" },
  { src: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80", alt: "Historická kamenná architektura" },
  { src: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=80", alt: "Kuchyně apartmánu" },
  { src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80", alt: "Výhled do krajiny" },
  { src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80", alt: "Detail vybavení apartmánu" },
  { src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80", alt: "Příroda na Šumavě" }
]

export const priceCards = [
  {
    badge: "Apartmán 1",
    name: "Studio ³",
    subtitle: "Útulné studio - až 4 osoby",
    seasons: [
      { label: "Mimo sezónu (říjen-duben)", price: "1 900 Kč / noc" },
      { label: "Sezóna (květen-září)", price: "2 400 Kč / noc" },
      { label: "Víkendy a svátky", price: "2 600 Kč / noc" }
    ]
  },
  {
    badge: "Apartmán 2",
    name: "Loft ¹⁰",
    subtitle: "Prostorný loft - až 6 osob",
    seasons: [
      { label: "Mimo sezónu (říjen-duben)", price: "2 800 Kč / noc" },
      { label: "Sezóna (květen-září)", price: "3 200 Kč / noc" },
      { label: "Víkendy a svátky", price: "3 400 Kč / noc" }
    ]
  }
]

export const apartments = [
  {
    badge: "Apartmán 1",
    name: "Studio ³",
    desc: "Útulné studio až pro 4 osoby. Ideální pro hosty, kteří hledají jednoduchost, klid a pohodlí.",
    imageUrl: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80",
    imageAlt: "Apartmán 1"
  },
  {
    badge: "Apartmán 2",
    name: "Loft ¹⁰",
    desc: "Prostorný loft až pro 6 osob s dostatkem místa pro rodinu nebo delší pobyt. Kombinace pohodlí a vzdušného prostoru.",
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80",
    imageAlt: "Apartmán 2"
  }
]

export const reviews = [
  { text: "Krásné místo, naprostý klid a nádherný výhled. Určitě se vrátíme.", author: "Jana & Tomáš" },
  { text: "Stylové ubytování, všechno perfektně připravené. Nic nám nechybělo.", author: "Markéta K." },
  { text: "Ideální únik z města. Ticho, příroda, pohoda. Přesně to, co jsme potřebovali.", author: "Rodina Novákova" }
]
