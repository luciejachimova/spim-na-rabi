import { EmailLayout } from "./layout"
import { CtaButton, Heading, Paragraph, ReservationSummary, Signoff, type EmailTranslator, type ReservationSummaryData } from "./components"
import { formatReservationDate } from "@/lib/prague-date"
import { businessInfo } from "@/data/guest-info"

export interface ReservationConfirmationProps {
  t: EmailTranslator
  locale: string
  name: string
  reservationUrl: string
  summary: ReservationSummaryData
}

export function reservationConfirmationSubject(t: EmailTranslator) {
  return t("email.confirmation.subject")
}

export function ReservationConfirmationEmail({ t, locale, name, reservationUrl, summary }: ReservationConfirmationProps) {
  return (
    <EmailLayout preheader={t("email.confirmation.preheader")} locale={locale} t={t}>
      <Heading>{t("email.greeting", { name })}</Heading>
      <Paragraph>{t("email.confirmation.intro")}</Paragraph>
      <ReservationSummary data={summary} locale={locale} t={t} />
      <Paragraph>{t("email.confirmation.afterSummary")}</Paragraph>
      <CtaButton href={reservationUrl}>{t("email.confirmation.button")}</CtaButton>
      <Paragraph>{t("email.confirmation.contactLine", { phone: businessInfo.phone, email: businessInfo.email })}</Paragraph>
      <Signoff t={t} />
    </EmailLayout>
  )
}

export function reservationConfirmationText({ t, locale, name, reservationUrl, summary }: ReservationConfirmationProps) {
  const lines = [
    t("email.greeting", { name }),
    "",
    t("email.confirmation.intro"),
    "",
    `${t("labels.apartment")}: ${summary.apartmentName}`,
    `${t("labels.checkIn")}: ${formatReservationDate(summary.startDate, locale)}`,
    `${t("labels.checkOut")}: ${formatReservationDate(summary.endDate, locale)}`,
    `${t("labels.nights")}: ${summary.nights}`,
    ...(summary.guests !== null ? [`${t("labels.guests")}: ${summary.guests}`] : []),
    "",
    t("email.confirmation.afterSummary"),
    "",
    `${t("email.confirmation.button")}: ${reservationUrl}`,
    "",
    t("email.confirmation.contactLine", { phone: businessInfo.phone, email: businessInfo.email }),
    "",
    t("email.signoffNames"),
    "Spim na Rabí"
  ]
  return lines.join("\n")
}
