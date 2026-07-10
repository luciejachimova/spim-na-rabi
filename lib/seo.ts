import type { Metadata } from "next"
import { getPathname } from "@/i18n/navigation"
import { routing, type Locale } from "@/i18n/routing"

// OpenGraph locale codes per site locale.
export const OG_LOCALE: Record<Locale, string> = {
  cs: "cs_CZ",
  de: "de_DE",
  en: "en_GB"
}

type Href = Parameters<typeof getPathname>[0]["href"]

// Builds canonical + hreflang alternates for a given internal route, resolving
// each locale's externally visible (localized) pathname via next-intl.
export function buildAlternates(locale: Locale, href: Href): Metadata["alternates"] {
  const languages: Record<string, string> = {}
  for (const l of routing.locales) {
    languages[l] = getPathname({ href, locale: l })
  }
  languages["x-default"] = getPathname({ href, locale: routing.defaultLocale })

  return {
    canonical: getPathname({ href, locale }),
    languages
  }
}
