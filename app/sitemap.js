import { getPathname } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"

const baseUrl = "https://spimnarabi.cz"

// Internal (canonical) routes and their crawl priorities. Localized URLs and
// hreflang alternates are derived per locale via next-intl.
const pages = [
  { href: "/", changeFrequency: "monthly", priority: 1 },
  { href: "/o-nas", changeFrequency: "yearly", priority: 0.7 },
  { href: "/galerie", changeFrequency: "monthly", priority: 0.8 },
  { href: "/cenik", changeFrequency: "monthly", priority: 0.9 },
  { href: "/kontakt", changeFrequency: "yearly", priority: 0.8 },
  { href: "/gdpr", changeFrequency: "yearly", priority: 0.3 },
  { href: "/podminky", changeFrequency: "yearly", priority: 0.3 },
  { href: "/storno", changeFrequency: "yearly", priority: 0.3 }
]

function absolute(href, locale) {
  return `${baseUrl}${getPathname({ href, locale })}`
}

export default function sitemap() {
  return pages.map((page) => {
    const languages = {}
    for (const locale of routing.locales) {
      languages[locale] = absolute(page.href, locale)
    }
    languages["x-default"] = absolute(page.href, routing.defaultLocale)

    return {
      url: absolute(page.href, routing.defaultLocale),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: { languages }
    }
  })
}
