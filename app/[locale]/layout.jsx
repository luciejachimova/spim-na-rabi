import "../globals.css"
import { notFound } from "next/navigation"
import { NextIntlClientProvider, hasLocale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import ClientChrome from "@/components/ClientChrome"
import { routing } from "@/i18n/routing"
import { buildAlternates, OG_LOCALE } from "@/lib/seo"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "meta" })

  return {
    metadataBase: new URL("https://spimnarabi.cz"),
    title: {
      default: t("home.title"),
      template: t("titleTemplate")
    },
    description: t("home.description"),
    keywords: t.raw("keywords"),
    authors: [{ name: "Spim na Rabí" }],
    creator: "Spim na Rabí",
    publisher: "Spim na Rabí",
    category: "travel",
    referrer: "origin-when-cross-origin",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1
      }
    },
    alternates: buildAlternates(locale, "/"),
    icons: {
      icon: "/images/spim-na-rabi-favicon.png",
      shortcut: "/images/spim-na-rabi-favicon.png",
      apple: "/images/spim-na-rabi-favicon.png"
    },
    openGraph: {
      title: t("home.title"),
      description: t("home.description"),
      url: "https://spimnarabi.cz",
      siteName: "Spim na Rabí",
      locale: OG_LOCALE[locale],
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: "Spim na Rabí",
      description: t("home.description")
    }
  }
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: "meta" })

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": "https://spimnarabi.cz/#ubytovani",
    name: "Spim na Rabí",
    description: t("defaultDescription"),
    url: "https://spimnarabi.cz",
    telephone: "+420723936426",
    email: "spimnarabi@seznam.cz",
    priceRange: "2 000–2 600 Kč",
    petsAllowed: true,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Rabí 175",
      postalCode: "342 01",
      addressLocality: "Rabí",
      addressCountry: "CZ"
    },
    sameAs: [
      "https://www.facebook.com/profile.php?id=61579506120985",
      "https://www.instagram.com/spimnarabi/"
    ]
  }

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="bg-cream text-dark antialiased">
        <NextIntlClientProvider>
          <ClientChrome>{children}</ClientChrome>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
