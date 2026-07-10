import { EmailLayout } from "./layout"
import { Heading, Paragraph, Signoff, type EmailTranslator } from "./components"
import { businessInfo } from "@/data/guest-info"

export interface DepartureReminderProps {
  t: EmailTranslator
  locale: string
  name: string
  apartmentSlug: string
  apartmentName: string
}

export function departureReminderSubject(t: EmailTranslator) {
  return t("email.departure.subject")
}

export function DepartureReminderEmail({ t, locale, name, apartmentName }: DepartureReminderProps) {
  return (
    <EmailLayout preheader={t("email.departure.preheader")} locale={locale} t={t}>
      <Heading>{t("email.greeting", { name })}</Heading>
      <Paragraph>{t("email.departure.intro", { apartment: apartmentName })}</Paragraph>
      <Paragraph>{t("email.departure.checkOutLine", { time: t("guestInfo.checkOutTime") })}</Paragraph>
      <Paragraph>{t("email.departure.keysLine")}</Paragraph>
      <Paragraph>{t("email.departure.contactLine", { phone: businessInfo.phone, email: businessInfo.email })}</Paragraph>
      <Signoff t={t} />
    </EmailLayout>
  )
}

export function departureReminderText({ t, name, apartmentName }: DepartureReminderProps) {
  const lines = [
    t("email.greeting", { name }),
    "",
    t("email.departure.intro", { apartment: apartmentName }),
    "",
    t("email.departure.checkOutLine", { time: t("guestInfo.checkOutTime") }),
    "",
    t("email.departure.keysLine"),
    "",
    t("email.departure.contactLine", { phone: businessInfo.phone, email: businessInfo.email }),
    "",
    t("email.signoffNames"),
    "Spim na Rabí"
  ]
  return lines.join("\n")
}
