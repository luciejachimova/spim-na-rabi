import { EmailLayout } from "./layout"
import { Heading, Paragraph, Signoff } from "./components"
import { businessInfo, getGuestInfo } from "@/data/guest-info"

export interface DepartureReminderProps {
  name: string
  apartmentSlug: string
  apartmentName: string
}

export function departureReminderSubject() {
  return "Dnes je den vašeho odjezdu – Spim na Rabí"
}

export function DepartureReminderEmail({ name, apartmentSlug, apartmentName }: DepartureReminderProps) {
  const info = getGuestInfo(apartmentSlug)

  return (
    <EmailLayout preheader="Děkujeme za pobyt – pár slov k dnešnímu odjezdu.">
      <Heading>Dobrý den, {name},</Heading>
      <Paragraph>děkujeme za pobyt v apartmánu {apartmentName}. Dnes je den vašeho odjezdu.</Paragraph>
      <Paragraph>
        {info.checkOutTime
          ? `Check-out je do ${info.checkOutTime}.`
          : "Prosíme o odjezd v dohodnutém čase."}
      </Paragraph>
      <Paragraph>Klíče prosím vraťte stejným způsobem, jakým jste je při příjezdu převzali.</Paragraph>
      <Paragraph>
        V případě jakéhokoli problému nás kontaktujte na telefonu {businessInfo.phone} nebo e-mailu{" "}
        {businessInfo.email}.
      </Paragraph>
      <Signoff />
    </EmailLayout>
  )
}

export function departureReminderText({ name, apartmentName, apartmentSlug }: DepartureReminderProps) {
  const info = getGuestInfo(apartmentSlug)
  const lines = [
    `Dobrý den, ${name},`,
    "",
    `děkujeme za pobyt v apartmánu ${apartmentName}. Dnes je den vašeho odjezdu.`,
    "",
    info.checkOutTime ? `Check-out je do ${info.checkOutTime}.` : "Prosíme o odjezd v dohodnutém čase.",
    "",
    "Klíče prosím vraťte stejným způsobem, jakým jste je při příjezdu převzali.",
    "",
    `V případě jakéhokoli problému nás kontaktujte na telefonu ${businessInfo.phone} nebo e-mailu ${businessInfo.email}.`,
    "",
    businessInfo.signoffNames,
    "Spim na Rabí"
  ]
  return lines.join("\n")
}
