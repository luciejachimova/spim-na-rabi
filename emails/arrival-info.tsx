import { EmailLayout } from "./layout"
import { CtaButton, Heading, InfoRow, Paragraph, ReservationSummary, Signoff, type ReservationSummaryData } from "./components"
import { businessInfo, getGuestInfo } from "@/data/guest-info"

export interface ArrivalInfoProps {
  name: string
  apartmentSlug: string
  reservationUrl: string
  summary: ReservationSummaryData
}

export function arrivalInfoSubject() {
  return "Informace k vašemu příjezdu – Spim na Rabí"
}

export function ArrivalInfoEmail({ name, apartmentSlug, reservationUrl, summary }: ArrivalInfoProps) {
  const info = getGuestInfo(apartmentSlug)

  return (
    <EmailLayout preheader="Zítra vás čekáme – posíláme vám informace k pobytu.">
      <Heading>Dobrý den, {name},</Heading>
      <Paragraph>zítra vás čekáme ve Spim na Rabí. Posíláme vám informace, které se budou hodit k pobytu.</Paragraph>
      <ReservationSummary data={summary} />

      {info.address && (
        <InfoRow label="Adresa">
          {info.address}
          {info.googleMapsUrl && (
            <>
              {" "}
              ·{" "}
              <a href={info.googleMapsUrl} style={{ color: "#8B7355" }}>
                otevřít v Google Maps
              </a>
            </>
          )}
        </InfoRow>
      )}

      {info.parkingInfo && <InfoRow label="Parkování">{info.parkingInfo}</InfoRow>}

      {info.checkInTime && <InfoRow label="Check-in">od {info.checkInTime}</InfoRow>}

      {info.keyInstructions && <InfoRow label="Převzetí klíčů">{info.keyInstructions}</InfoRow>}

      {info.wifiNetwork && (
        <InfoRow label="Wifi">
          Síť: {info.wifiNetwork}
          {info.wifiPassword && <>, heslo: {info.wifiPassword}</>}
        </InfoRow>
      )}

      {info.importantInfo && <InfoRow label="Důležité informace">{info.importantInfo}</InfoRow>}

      <Paragraph>Přejeme šťastnou cestu.</Paragraph>

      <CtaButton href={reservationUrl}>Zobrazit rezervaci</CtaButton>

      <Paragraph>
        V případě potřeby nás kontaktujte na telefonu {businessInfo.phone} nebo e-mailu {businessInfo.email}.
      </Paragraph>
      <Signoff />
    </EmailLayout>
  )
}

export function arrivalInfoText({ name, apartmentSlug, reservationUrl, summary }: ArrivalInfoProps) {
  const info = getGuestInfo(apartmentSlug)
  const lines = [
    `Dobrý den, ${name},`,
    "",
    "zítra vás čekáme ve Spim na Rabí. Posíláme vám informace, které se budou hodit k pobytu.",
    "",
    `Apartmán: ${summary.apartmentName}`,
    `Příjezd: ${summary.startDate}`,
    `Odjezd: ${summary.endDate}`,
    ""
  ]

  if (info.address) {
    lines.push(`Adresa: ${info.address}${info.googleMapsUrl ? ` (${info.googleMapsUrl})` : ""}`)
  }
  if (info.parkingInfo) lines.push(`Parkování: ${info.parkingInfo}`)
  if (info.checkInTime) lines.push(`Check-in: od ${info.checkInTime}`)
  if (info.keyInstructions) lines.push(`Převzetí klíčů: ${info.keyInstructions}`)
  if (info.wifiNetwork) {
    lines.push(`Wifi: síť ${info.wifiNetwork}${info.wifiPassword ? `, heslo ${info.wifiPassword}` : ""}`)
  }
  if (info.importantInfo) lines.push(`Důležité informace: ${info.importantInfo}`)

  lines.push(
    "",
    "Přejeme šťastnou cestu.",
    "",
    `Zobrazit rezervaci: ${reservationUrl}`,
    "",
    `V případě potřeby nás kontaktujte na telefonu ${businessInfo.phone} nebo e-mailu ${businessInfo.email}.`,
    "",
    businessInfo.signoffNames,
    "Spim na Rabí"
  )

  return lines.join("\n")
}
