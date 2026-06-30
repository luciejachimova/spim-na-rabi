import "./globals.css";
import ClientChrome from "@/components/ClientChrome";

export const metadata = {
  metadataBase: new URL("https://spimnarabi.cz"),

  title: {
    default: "Spim na Rabí | Stylové ubytování pod hradem Rabí",
    template: "%s | Spim na Rabí",
  },

  description:
    "Studio a prostorný loft v Rabí v Pošumaví, jen pár kroků od hradu Rabí. Stylové ubytování až pro 4 nebo 6 osob.",

  keywords: [
    "ubytování Rabí",
    "apartmán Rabí",
    "ubytování Pošumaví",
    "ubytování Šumava",
    "hrad Rabí",
    "apartmán Šumava",
    "dovolená Rabí",
    "ubytování Sušice",
    "spim na rabí",
  ],

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
      "max-video-preview": -1,
    },
  },

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: "/images/spim-na-rabi-favicon.png",
    shortcut: "/images/spim-na-rabi-favicon.png",
    apple: "/images/spim-na-rabi-favicon.png",
  },

  openGraph: {
    title: "Spim na Rabí | Stylové ubytování pod hradem Rabí",
    description:
      "Studio a prostorný loft v Rabí v Pošumaví. Ubytování až pro 4 nebo 6 osob jen pár kroků od hradu Rabí.",
    url: "https://spimnarabi.cz",
    siteName: "Spim na Rabí",
    locale: "cs_CZ",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Spim na Rabí",
    description: "Studio a loft pod hradem Rabí v Pošumaví.",
  },
};

export default function RootLayout({ children }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": "https://spimnarabi.cz/#ubytovani",
    name: "Spim na Rabí",
    description:
      "Studio a prostorný loft v Rabí v Pošumaví, jen pár kroků od hradu Rabí.",
    url: "https://spimnarabi.cz",
    telephone: "+420723936426",
    email: "spimnarabi@seznam.cz",
    priceRange: "1 900–3 400 Kč za noc",
    petsAllowed: true,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Rabí 175",
      postalCode: "342 01",
      addressLocality: "Rabí",
      addressCountry: "CZ",
    },
    sameAs: [
      "https://www.facebook.com/profile.php?id=61579506120985",
      "https://www.instagram.com/spimnarabi/",
    ],
  };

  return (
    <html lang="cs" data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="bg-cream text-dark antialiased">
        <ClientChrome>{children}</ClientChrome>
      </body>
    </html>
  );
}
