import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import { getTranslator } from "@/lib/i18n-messages"
import { routing } from "@/i18n/routing"

export const alt = "Spim na Rabí"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// Satori ships no fonts of its own, so the brand faces have to be handed to it
// explicitly — otherwise the card falls back to a generic system serif that
// looks nothing like the site.
const asset = (...segments) => readFile(join(process.cwd(), ...segments))

export default async function OpenGraphImage({ params }) {
  const { locale } = await params
  const [meta, home, script, sans, serif, lineart] = await Promise.all([
    getTranslator(locale, "meta"),
    getTranslator(locale, "home"),
    asset("assets", "fonts", "DancingScript.ttf"),
    asset("assets", "fonts", "Jost.ttf"),
    asset("assets", "fonts", "CormorantGaramond.ttf"),
    asset("public", "images", "hero-rabi-lineart.png")
  ])

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(to bottom, #E8E1D7 0%, #F7F5F2 100%)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          position: "relative",
          width: "100%"
        }}
      >
        {/* Same castle line art as the homepage hero, at the same low opacity. */}
        <img
          src={`data:image/png;base64,${lineart.toString("base64")}`}
          width={1100}
          height={465}
          style={{ bottom: 40, opacity: 0.09, position: "absolute" }}
        />

        <div
          style={{
            color: "#888880",
            fontFamily: "Jost",
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase"
          }}
        >
          {home("heroEyebrow")}
        </div>

        <div
          style={{
            color: "#333333",
            fontFamily: "Dancing Script",
            fontSize: 150,
            lineHeight: 1.35,
            marginTop: 4
          }}
        >
          Spim na Rabí
        </div>

        <div
          style={{
            color: "#888880",
            fontFamily: "Cormorant Garamond",
            fontSize: 42,
            fontStyle: "italic",
            marginTop: 4
          }}
        >
          {home("heroSubtitle")}
        </div>

        <div style={{ background: "#8B7355", height: 1, marginTop: 40, opacity: 0.5, width: 80 }} />

        <div
          style={{
            color: "#8B7355",
            fontFamily: "Jost",
            fontSize: 21,
            letterSpacing: 5,
            marginTop: 26,
            textTransform: "uppercase"
          }}
        >
          {meta("ogSubtitle")}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Dancing Script", data: script, style: "normal", weight: 700 },
        { name: "Jost", data: sans, style: "normal", weight: 400 },
        { name: "Cormorant Garamond", data: serif, style: "italic", weight: 300 }
      ]
    }
  )
}
