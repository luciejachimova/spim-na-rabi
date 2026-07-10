import { defineRouting } from "next-intl/routing"

// Public site is available in three languages. Czech is the default and is
// served without a URL prefix ("as-needed"); German and English are prefixed
// (/de, /en). Admin (/admin) and API routes stay outside this routing and are
// never localized — see proxy.ts.
export const routing = defineRouting({
  locales: ["cs", "de", "en"],
  defaultLocale: "cs",
  localePrefix: "as-needed",

  // Localized URL slugs. The key is the internal route (matches the folder
  // structure under app/[locale], using the Czech/canonical slug); the value
  // is the externally visible pathname per locale. next-intl's Link/router
  // resolve to the localized href automatically.
  pathnames: {
    "/": "/",
    "/o-nas": { cs: "/o-nas", de: "/ueber-uns", en: "/about" },
    "/galerie": { cs: "/galerie", de: "/galerie", en: "/gallery" },
    "/cenik": { cs: "/cenik", de: "/preise", en: "/pricing" },
    "/kontakt": { cs: "/kontakt", de: "/kontakt", en: "/contact" },
    "/gdpr": { cs: "/gdpr", de: "/datenschutz", en: "/privacy" },
    "/podminky": { cs: "/podminky", de: "/agb", en: "/terms" },
    "/storno": { cs: "/storno", de: "/stornobedingungen", en: "/cancellation" },
    "/rezervace-vytvorena": {
      cs: "/rezervace-vytvorena",
      de: "/reservierung-erstellt",
      en: "/reservation-created"
    },
    // Dynamic guest reservation page — same slug across locales, only the
    // locale prefix differs. Linked from lifecycle emails.
    "/reservation/[token]": "/reservation/[token]"
  }
})

export type Locale = (typeof routing.locales)[number]
