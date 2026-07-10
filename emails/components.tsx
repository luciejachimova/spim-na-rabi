import { COLORS } from "./layout"
import { formatReservationDate } from "@/lib/prague-date"

const SANS_FONT = "'Jost', Helvetica, Arial, sans-serif"

// Minimal translator shape — the root (non-namespaced) createTranslator instance
// passed down from the email builders.
export interface EmailTranslator {
  (key: string, values?: Record<string, string | number>): string
  raw: (key: string) => unknown
}

export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 600, color: COLORS.dark, fontFamily: SANS_FONT }}>
      {children}
    </p>
  )
}

export function Paragraph({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 16px", fontSize: 15, lineHeight: "24px", color: COLORS.dark }}>{children}</p>
}

export interface ReservationSummaryData {
  apartmentName: string
  startDate: string
  endDate: string
  nights: number
  guests: number | null
}

export function ReservationSummary({
  data,
  locale,
  t
}: {
  data: ReservationSummaryData
  locale: string
  t: EmailTranslator
}) {
  const rows: [string, string][] = [
    [t("labels.apartment"), data.apartmentName],
    [t("labels.checkIn"), formatReservationDate(data.startDate, locale)],
    [t("labels.checkOut"), formatReservationDate(data.endDate, locale)],
    [t("labels.nights"), String(data.nights)]
  ]
  if (data.guests !== null) rows.push([t("labels.guests"), String(data.guests)])

  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ margin: "0 0 16px", backgroundColor: COLORS.pale, borderRadius: 2 }}>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td style={{ padding: "8px 20px", fontSize: 13, color: COLORS.mid, whiteSpace: "nowrap" }}>{label}</td>
            <td style={{ padding: "8px 20px 8px 0", fontSize: 14, color: COLORS.dark, textAlign: "right" }}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ margin: "0 0 16px" }}>
      <tbody>
        <tr>
          <td style={{ paddingBottom: 4, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: COLORS.mid }}>
            {label}
          </td>
        </tr>
        <tr>
          <td style={{ fontSize: 15, lineHeight: "22px", color: COLORS.dark }}>{children}</td>
        </tr>
      </tbody>
    </table>
  )
}

export function CtaButton({ href, children }: { href: string; children: string }) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} style={{ margin: "8px 0 24px" }}>
      <tbody>
        <tr>
          <td style={{ backgroundColor: COLORS.dark, borderRadius: 2 }}>
            <a
              href={href}
              style={{
                display: "inline-block",
                padding: "12px 28px",
                fontSize: 13,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#FFFFFF",
                textDecoration: "none"
              }}
            >
              {children}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export function Signoff({ t }: { t: EmailTranslator }) {
  return (
    <p style={{ margin: "24px 0 0", fontSize: 15, lineHeight: "24px", color: COLORS.dark }}>
      {t("email.signoffNames")}
      <br />
      Spim na Rabí
    </p>
  )
}
