// Served from a route handler rather than Next's app/manifest.ts convention,
// because that convention allows exactly one manifest per app and the public
// site already owns it (app/manifest.js). The manager needs its own so
// installing it puts /manager on the home screen, not spimnarabi.cz.
export const dynamic = "force-static"

export function GET() {
  const manifest = {
    id: "/manager",
    name: "Spim Manager",
    short_name: "Spim",
    description: "Správa apartmánů Spim na Rabí — rezervace, hosté a úklidy.",
    lang: "cs",
    dir: "ltr",
    // scope keeps the installed app from swallowing the public website: tapping
    // a spimnarabi.cz link opens the browser, not this app.
    scope: "/manager",
    start_url: "/manager",
    display: "standalone",
    orientation: "portrait",
    background_color: "#EFECE7",
    theme_color: "#333333",
    icons: [
      { src: "/manager/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/manager/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      // A separate padded icon: Android crops "any" icons to a circle on some
      // launchers, which would clip a monogram that fills the square.
      { src: "/manager/icons/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ],
    shortcuts: [
      { name: "Nová rezervace", url: "/manager/rezervace/nova" },
      { name: "Rezervace", url: "/manager/rezervace" },
      { name: "Hosté", url: "/manager/hoste" }
    ]
  }

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600"
    }
  })
}
