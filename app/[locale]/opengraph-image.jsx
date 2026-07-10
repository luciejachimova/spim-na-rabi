import { ImageResponse } from "next/og"
import { getTranslator } from "@/lib/i18n-messages"
import { routing } from "@/i18n/routing"

export const alt = "Spim na Rabí"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function OpenGraphImage({ params }) {
  const { locale } = await params
  const t = await getTranslator(locale, "meta")

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(145deg, #E8E1D7, #F7F5F2)",
          color: "#333333",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          padding: "70px",
          textAlign: "center",
          width: "100%"
        }}
      >
        <div style={{ fontFamily: "serif", fontSize: 82, marginBottom: 24 }}>Spim na Rabí</div>
        <div style={{ background: "#8B7355", height: 2, marginBottom: 28, width: 90 }} />
        <div style={{ color: "#6f6f68", fontSize: 32, letterSpacing: 3 }}>{t("ogSubtitle")}</div>
      </div>
    ),
    size
  )
}
