import { ImageResponse } from "next/og"

// iOS ignores manifest icons and reads apple-touch-icon, so the home-screen
// icon for an iPhone comes from here. It also does not apply a rounded mask to
// a transparent icon, hence the solid background.
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#333333",
          color: "#EFECE7",
          fontSize: 84,
          fontWeight: 500
        }}
      >
        SM
      </div>
    ),
    size
  )
}
