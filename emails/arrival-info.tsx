import { EmailLayout } from "./layout"
import { CtaButton, Heading, InfoRow, Paragraph, ReservationSummary, Signoff, type EmailTranslator, type ReservationSummaryData } from "./components"
import { formatReservationDate } from "@/lib/prague-date"
import { businessInfo, getGuestInfo } from "@/data/guest-info"

export interface ArrivalInfoProps {
  t: EmailTranslator
  locale: string
  name: string
  apartmentSlug: string
  reservationUrl: string
  summary: ReservationSummaryData
}

export function arrivalInfoSubject(t: EmailTranslator) {
  return t("email.arrival.subject")
}

export function ArrivalInfoEmail({ t, locale, name, apartmentSlug, reservationUrl, summary }: ArrivalInfoProps) {
  const info = getGuestInfo(apartmentSlug)
  const important = t.raw("guestInfo.important") as string[]

  return (
    <EmailLayout preheader={t("email.arrival.preheader")} locale={locale} t={t}>
      <Heading>{t("email.greeting", { name })}</Heading>
      <Paragraph>{t("email.arrival.intro")}</Paragraph>
      <ReservationSummary data={summary} locale={locale} t={t} />

      {info.address && (
        <InfoRow label={t("labels.address")}>
          {info.address}
          {info.googleMapsUrl && (
            <>
              {" "}
              ·{" "}
              <a href={info.googleMapsUrl} style={{ color: "#8B7355" }}>
                {t("labels.openMaps")}
              </a>
            </>
          )}
        </InfoRow>
      )}

      <InfoRow label={t("labels.parking")}>{t("guestInfo.parking")}</InfoRow>
      <InfoRow label={t("labels.checkInTime")}>{t("guestInfo.checkInTime")}</InfoRow>
      <InfoRow label={t("labels.keys")}>{t("guestInfo.keys")}</InfoRow>

      {info.wifiNetwork && (
        <InfoRow label={t("labels.wifi")}>
          {t("labels.wifiNetwork")}: {info.wifiNetwork}
          {info.wifiPassword && <>, {t("labels.wifiPassword")}: {info.wifiPassword}</>}
        </InfoRow>
      )}

      {important.length > 0 && (
        <InfoRow label={t("labels.important")}>
          {important.map((item, index) => (
            <span key={item}>
              {index > 0 && <br />}
              {item}
            </span>
          ))}
        </InfoRow>
      )}

      <Paragraph>{t("email.arrival.happyTravels")}</Paragraph>

      <CtaButton href={reservationUrl}>{t("email.arrival.button")}</CtaButton>

      <Paragraph>{t("email.arrival.contactLine", { phone: businessInfo.phone, email: businessInfo.email })}</Paragraph>
      <Signoff t={t} />
    </EmailLayout>
  )
}

export function arrivalInfoText({ t, locale, name, apartmentSlug, reservationUrl, summary }: ArrivalInfoProps) {
  const info = getGuestInfo(apartmentSlug)
  const important = t.raw("guestInfo.important") as string[]

  const lines = [
    t("email.greeting", { name }),
    "",
    t("email.arrival.intro"),
    "",
    `${t("labels.apartment")}: ${summary.apartmentName}`,
    `${t("labels.checkIn")}: ${formatReservationDate(summary.startDate, locale)}`,
    `${t("labels.checkOut")}: ${formatReservationDate(summary.endDate, locale)}`,
    ""
  ]

  if (info.address) {
    lines.push(`${t("labels.address")}: ${info.address}${info.googleMapsUrl ? ` (${info.googleMapsUrl})` : ""}`)
  }
  lines.push(`${t("labels.parking")}: ${t("guestInfo.parking")}`)
  lines.push(`${t("labels.checkInTime")}: ${t("guestInfo.checkInTime")}`)
  lines.push(`${t("labels.keys")}: ${t("guestInfo.keys")}`)
  if (info.wifiNetwork) {
    lines.push(`${t("labels.wifi")}: ${info.wifiNetwork}${info.wifiPassword ? `, ${t("labels.wifiPassword")} ${info.wifiPassword}` : ""}`)
  }
  if (important.length > 0) {
    lines.push(`${t("labels.important")}:`, ...important.map((item) => `- ${item}`))
  }

  lines.push(
    "",
    t("email.arrival.happyTravels"),
    "",
    `${t("email.arrival.button")}: ${reservationUrl}`,
    "",
    t("email.arrival.contactLine", { phone: businessInfo.phone, email: businessInfo.email }),
    "",
    t("email.signoffNames"),
    "Spim na Rabí"
  )

  return lines.join("\n")
}
