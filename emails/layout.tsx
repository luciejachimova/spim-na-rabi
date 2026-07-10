import type { ReactNode } from "react"
import type { EmailTranslator } from "./components"

// Colors match the public site's Tailwind theme tokens (tailwind.config.js).
// Email clients don't apply Tailwind/CSS classes reliably, so every value
// here is inlined and the layout is table-based for Outlook compatibility.
export const COLORS = {
  cream: "#E8E1D7",
  dark: "#333333",
  mid: "#888880",
  light: "#C8C4BC",
  pale: "#F7F5F2",
  accent: "#8B7355"
}

// The site uses Google Fonts (Jost, Cormorant Garamond) that won't load in
// most email clients — these stacks approximate them with system fonts.
const SERIF_FONT = "'Cormorant Garamond', Georgia, 'Times New Roman', serif"
const SANS_FONT = "'Jost', Helvetica, Arial, sans-serif"

export function EmailLayout({
  preheader,
  locale,
  t,
  children
}: {
  preheader: string
  locale: string
  t: EmailTranslator
  children: ReactNode
}) {
  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Spim na Rabí</title>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: COLORS.cream, fontFamily: SANS_FONT }}>
        <span style={{ display: "none", overflow: "hidden", lineHeight: "1px", opacity: 0, maxHeight: 0, maxWidth: 0 }}>
          {preheader}
        </span>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: COLORS.cream }}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: "32px 16px" }}>
                <table
                  role="presentation"
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{ maxWidth: 560, backgroundColor: "#FFFFFF", borderRadius: 2 }}
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: "32px 40px 24px", borderBottom: `1px solid ${COLORS.light}` }}>
                        <p
                          style={{
                            margin: 0,
                            fontFamily: SERIF_FONT,
                            fontSize: 24,
                            color: COLORS.dark
                          }}
                        >
                          Spim na Rabí
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "32px 40px" }}>{children}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "24px 40px 32px", borderTop: `1px solid ${COLORS.light}` }}>
                        <p style={{ margin: 0, fontSize: 13, lineHeight: "20px", color: COLORS.mid }}>
                          {t("email.footerAddress")}
                          <br />
                          {"•"} {t("email.footerPhone")}: +420 723 936 426 · {t("email.footerEmail")}:{" "}
                          <a href="mailto:spimnarabi@seznam.cz" style={{ color: COLORS.accent }}>
                            spimnarabi@seznam.cz
                          </a>
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  )
}
