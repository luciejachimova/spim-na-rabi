import { EmailLayout } from "./layout"
import { CtaButton, Heading, Paragraph, Signoff, type EmailTranslator } from "./components"
import { businessInfo, getGuestInfo } from "@/data/guest-info"
import type { ReservationSource } from "@/lib/reservations"

export interface ThankYouProps {
  t: EmailTranslator
  locale: string
  name: string
  apartmentSlug: string
  source: ReservationSource
}

export function thankYouSubject(t: EmailTranslator) {
  return t("email.thankYou.subject")
}

function reviewLink(props: ThankYouProps): { label: string; url: string } | null {
  const { t } = props
  const info = getGuestInfo(props.apartmentSlug)

  if (props.source === "booking" && info.bookingReviewUrl) {
    return { label: t("email.thankYou.reviewBooking"), url: info.bookingReviewUrl }
  }
  if (props.source === "airbnb" && info.airbnbReviewUrl) {
    return { label: t("email.thankYou.reviewAirbnb"), url: info.airbnbReviewUrl }
  }
  if (props.source === "website" && businessInfo.googleReviewUrl) {
    return { label: t("email.thankYou.reviewGoogle"), url: businessInfo.googleReviewUrl }
  }
  return null
}

export function ThankYouEmail(props: ThankYouProps) {
  const { t, locale, name } = props
  const review = reviewLink(props)

  return (
    <EmailLayout preheader={t("email.thankYou.preheader")} locale={locale} t={t}>
      <Heading>{t("email.greeting", { name })}</Heading>
      <Paragraph>{t("email.thankYou.intro")}</Paragraph>
      {review && (
        <>
          <Paragraph>{t("email.thankYou.reviewIntro")}</Paragraph>
          <CtaButton href={review.url}>{review.label}</CtaButton>
        </>
      )}
      <Paragraph>{t("email.thankYou.closing")}</Paragraph>
      <Signoff t={t} />
    </EmailLayout>
  )
}

export function thankYouText(props: ThankYouProps) {
  const { t, name } = props
  const review = reviewLink(props)
  const lines = [t("email.greeting", { name }), "", t("email.thankYou.intro")]

  if (review) {
    lines.push("", t("email.thankYou.reviewIntro"), `${review.label}: ${review.url}`)
  }

  lines.push("", t("email.thankYou.closing"), "", t("email.signoffNames"), "Spim na Rabí")
  return lines.join("\n")
}
