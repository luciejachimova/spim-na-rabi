import "./globals.css";
import ClientChrome from "@/components/ClientChrome";

export const metadata = {
  metadataBase: new URL("https://spimnarabi.cz"),

  title: {
    default: "Spim na Rabí | Stylové ubytování pod hradem Rabí",
    template: "%s | Spim na Rabí",
  },

  description:
    "Stylové ubytování v malebném městečku Rabí. Komfortní apartmán v Pošumaví jen pár kroků od hradu Rabí. Ideální pro páry, rodiny i cyklisty.",

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
      "Stylové ubytování v srdci Pošumaví. Jen pár kroků od hradu Rabí.",
    url: "https://spimnarabi.cz",
    siteName: "Spim na Rabí",
    locale: "cs_CZ",
    type: "website",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Spim na Rabí",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Spim na Rabí",
    description: "Stylové ubytování pod hradem Rabí.",
    images: ["/images/og-image.jpg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <body className="bg-cream text-dark antialiased">
        <ClientChrome>{children}</ClientChrome>
      </body>
    </html>
  );
}
