import "./globals.css"
import ClientChrome from "@/components/ClientChrome"

export const metadata = {
  title: {
    default: "Spím na Rabí",
    template: "%s - Spím na Rabí"
  },
  description: "Ubytování pod hradem Rabí. Klid, příroda a pohodlí.",
  icons: {
    icon: "/images/spim-na-rabi-favicon.png",
    apple: "/images/spim-na-rabi-favicon.png"
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <body className="bg-cream text-dark antialiased">
        <ClientChrome>{children}</ClientChrome>
      </body>
    </html>
  )
}
