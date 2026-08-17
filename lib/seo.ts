import type { Metadata } from "next"
import { getPathname } from "@/i18n/navigation"
import { routing, type Locale } from "@/i18n/routing"

// The canonical origin, and the single place it is written down. It must match
// the host the site is actually served on: the apex 308-redirects to www, so
// declaring the apex as canonical pointed every canonical, hreflang and sitemap
// entry at a URL that redirects — which makes Google pick its own canonical and
// makes hreflang annotations liable to be dropped.
export const SITE_URL = "https://www.spimnarabi.cz"

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
