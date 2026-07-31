import "../globals.css"
import type { Metadata, Viewport } from "next"
import ManagerShell from "@/components/manager/manager-shell"

// A third independent root layout alongside app/[locale] (public site) and
// app/admin. The manager is its own installable app: Czech only, never
// indexed, and its own manifest so "add to home screen" installs /manager
// rather than the public site.
export const metadata: Metadata = {
  title: "Spim Manager",
  applicationName: "Spim Manager",
  manifest: "/manager/manifest.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "Spim Manager",
    statusBarStyle: "black-translucent"
  }
}

export const viewport: Viewport = {
  themeColor: "#333333",
  // Fills the notch area on an installed iOS app instead of letter-boxing it.
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1
}

export default function ManagerRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" data-scroll-behavior="smooth">
      <body className="bg-sand font-jost text-dark antialiased">
        <ManagerShell>{children}</ManagerShell>
      </body>
    </html>
  )
}
