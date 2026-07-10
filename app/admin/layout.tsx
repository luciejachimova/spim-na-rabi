import "../globals.css"
import type { Metadata } from "next"

// Admin is a separate, non-localized root layout (Czech only). The public site
// owns its own <html> in app/[locale]/layout.jsx; there is no shared
// app/layout — admin and the localized site are independent root layouts.
export const metadata: Metadata = {
  title: "Administrace | Spim na Rabí",
  robots: { index: false, follow: false }
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" data-scroll-behavior="smooth">
      <body className="bg-cream text-dark antialiased">{children}</body>
    </html>
  )
}
