import { EmailLayout } from "./layout"
import { CtaButton, Heading, Paragraph, Signoff } from "./components"
import { businessInfo, getGuestInfo } from "@/data/guest-info"
import type { ReservationSource } from "@/lib/reservations"

export interface ThankYouProps {
  name: string
  apartmentSlug: string
  source: ReservationSource
}

export function thankYouSubject() {
  return "Děkujeme za návštěvu – Spim na Rabí"
}

function reviewLink(props: ThankYouProps): { label: string; url: string } | null {
  const info = getGuestInfo(props.apartmentSlug)

  if (props.source === "booking" && info.bookingReviewUrl) {
    return { label: "Ohodnotit pobyt na Booking.com", url: info.bookingReviewUrl }
  }
  if (props.source === "airbnb" && info.airbnbReviewUrl) {
    return { label: "Ohodnotit pobyt na Airbnb", url: info.airbnbReviewUrl }
  }
  if (props.source === "website" && businessInfo.googleReviewUrl) {
    return { label: "Ohodnotit nás na Google", url: businessInfo.googleReviewUrl }
  }
  return null
}

export function ThankYouEmail(props: ThankYouProps) {
  const review = reviewLink(props)

  return (
    <EmailLayout preheader="Děkujeme za návštěvu Spim na Rabí.">
      <Heading>Dobrý den, {props.name},</Heading>
      <Paragraph>děkujeme za návštěvu Spim na Rabí.</Paragraph>
      {review && (
        <>
          <Paragraph>Pokud budete mít chvíli, budeme vděční za hodnocení – moc nám to pomůže.</Paragraph>
          <CtaButton href={review.url}>{review.label}</CtaButton>
        </>
      )}
      <Paragraph>Přejeme vám hezký zbytek dne.</Paragraph>
      <Signoff />
    </EmailLayout>
  )
}

export function thankYouText(props: ThankYouProps) {
  const review = reviewLink(props)
  const lines = [`Dobrý den, ${props.name},`, "", "děkujeme za návštěvu Spim na Rabí."]

  if (review) {
    lines.push("", "Pokud budete mít chvíli, budeme vděční za hodnocení – moc nám to pomůže.", `${review.label}: ${review.url}`)
  }

  lines.push("", "Přejeme vám hezký zbytek dne.", "", businessInfo.signoffNames, "Spim na Rabí")
  return lines.join("\n")
}
