import { EmailLayout } from "./layout"
import { CtaButton, Heading, Paragraph, ReservationSummary, Signoff, type ReservationSummaryData } from "./components"
import { businessInfo } from "@/data/guest-info"

export interface ReservationConfirmationProps {
  name: string
  reservationUrl: string
  summary: ReservationSummaryData
}

export function reservationConfirmationSubject() {
  return "Potvrzení rezervace – Spim na Rabí"
}

export function ReservationConfirmationEmail({ name, reservationUrl, summary }: ReservationConfirmationProps) {
  return (
    <EmailLayout preheader="Vaše rezervace ve Spim na Rabí byla úspěšně vytvořena.">
      <Heading>Dobrý den, {name},</Heading>
      <Paragraph>děkujeme za rezervaci pobytu ve Spim na Rabí. Vaše rezervace byla úspěšně vytvořena.</Paragraph>
      <ReservationSummary data={summary} />
      <Paragraph>
        Den před příjezdem vám pošleme e-mail se všemi informacemi, které budete k pobytu potřebovat – adresu,
        parkování, wifi a informace k převzetí klíčů.
      </Paragraph>
      <CtaButton href={reservationUrl}>Zobrazit rezervaci</CtaButton>
      <Paragraph>
        V případě jakýchkoli dotazů nás můžete kontaktovat na telefonu {businessInfo.phone} nebo e-mailu{" "}
        {businessInfo.email}.
      </Paragraph>
      <Signoff />
    </EmailLayout>
  )
}

export function reservationConfirmationText({ name, reservationUrl, summary }: ReservationConfirmationProps) {
  const lines = [
    `Dobrý den, ${name},`,
    "",
    "děkujeme za rezervaci pobytu ve Spim na Rabí. Vaše rezervace byla úspěšně vytvořena.",
    "",
    `Apartmán: ${summary.apartmentName}`,
    `Příjezd: ${summary.startDate}`,
    `Odjezd: ${summary.endDate}`,
    `Počet nocí: ${summary.nights}`,
    ...(summary.guests !== null ? [`Počet hostů: ${summary.guests}`] : []),
    "",
    "Den před příjezdem vám pošleme e-mail se všemi informacemi, které budete k pobytu potřebovat – adresu, parkování, wifi a informace k převzetí klíčů.",
    "",
    `Zobrazit rezervaci: ${reservationUrl}`,
    "",
    `V případě jakýchkoli dotazů nás můžete kontaktovat na telefonu ${businessInfo.phone} nebo e-mailu ${businessInfo.email}.`,
    "",
    businessInfo.signoffNames,
    "Spim na Rabí"
  ]
  return lines.join("\n")
}
