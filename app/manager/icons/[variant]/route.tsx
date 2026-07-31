import { ImageResponse } from "next/og"

// Icons are rendered rather than committed as binaries: no PNG files to keep in
// sync with the palette, and no image-processing dependency. The URLs are fixed
// (not content-hashed like Next's icon.tsx convention) because the manifest has
// to reference them by a stable path.
//
// No web font is loaded on purpose — that would mean a network fetch at render
// time, and an icon that silently fails when fonts.googleapis.com is slow. The
// monogram is plain geometry in the platform sans.
const VARIANTS = {
  "192": { size: 192, padding: 0 },
  "512": { size: 512, padding: 0 },
  // Android launchers crop "any" icons to a circle on some devices; the
  // maskable variant keeps the monogram inside the safe zone (80% of the
  // canvas) so nothing is clipped.
  maskable: { size: 512, padding: 0.1 }
} as const

type Variant = keyof typeof VARIANTS

export function generateStaticParams() {
  return Object.keys(VARIANTS).map((variant) => ({ variant }))
}

export async function GET(_request: Request, context: { params: Promise<{ variant: string }> }) {
  const { variant } = await context.params
  const config = VARIANTS[variant as Variant]

  if (!config) {
    return new Response("Not found", { status: 404 })
  }

  const { size, padding } = config
  const inset = Math.round(size * padding)
  const glyphSize = Math.round((size - inset * 2) * 0.46)

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#EFECE7"
        }}
      >
        <div
          style={{
            width: size - inset * 2,
            height: size - inset * 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#333333",
            borderRadius: padding > 0 ? "50%" : Math.round(size * 0.16),
            color: "#EFECE7",
            fontSize: glyphSize,
            fontWeight: 500,
            letterSpacing: -glyphSize * 0.04
          }}
        >
          SM
        </div>
      </div>
    ),
    { width: size, height: size }
  )
}
