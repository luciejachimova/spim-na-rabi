import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { getReservationByToken, isBlocking } from "@/lib/reservations"
import { formatReservationDate, toUtcDate } from "@/lib/prague-date"
import { getGuestInfo, businessInfo } from "@/data/guest-info"
import { PageHero } from "@/components/ui"
import type { Locale } from "@/i18n/routing"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ locale: Locale; token: string }>
}

export async function generateMetadata() {
  return { robots: { index: false, follow: false } }
}

function computeNights(startDate: string, endDate: string) {
  return Math.round((toUtcDate(endDate).getTime() - toUtcDate(startDate).getTime()) / 86_400_000)
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-mid/10 py-4">
      <p className="mb-1 text-[0.65rem] uppercase tracking-[0.22em] text-mid">{label}</p>
      <p className="text-[0.95rem] leading-relaxed text-dark">{children}</p>
    </div>
  )
}

export default async function ReservationTokenPage({ params }: PageProps) {
  const { locale, token } = await params
  setRequestLocale(locale)
  const reservation = await getReservationByToken(token)

  if (!reservation || !isBlocking(reservation.status)) {
    notFound()
  }

  const info = getGuestInfo(reservation.apartmentSlug)
  const nights = computeNights(reservation.startDate, reservation.endDate)

  const labels = await getTranslations("labels")
  const gi = await getTranslations("guestInfo")
  const rv = await getTranslations("reservationView")
  const importantItems = gi.raw("important") as string[]

  return (
    <>
      <PageHero label={rv("heroLabel")} title={reservation.apartmentName} />

      <section className="py-24 md:py-[100px]">
        <div className="mx-auto max-w-[720px] px-8">
          <div className="js-fade-in">
            <InfoRow label={labels("checkIn")}>{formatReservationDate(reservation.startDate, locale)}</InfoRow>
            <InfoRow label={labels("checkOut")}>{formatReservationDate(reservation.endDate, locale)}</InfoRow>
            <InfoRow label={labels("nights")}>{nights}</InfoRow>
            {reservation.guests !== null && <InfoRow label={labels("guests")}>{reservation.guests}</InfoRow>}

            {info.address && (
              <InfoRow label={labels("address")}>
                {info.address}
                {info.googleMapsUrl && (
                  <>
                    {" "}
                    ·{" "}
                    <a href={info.googleMapsUrl} className="text-accent transition-colors hover:text-dark">
                      {labels("openMaps")}
                    </a>
                  </>
                )}
              </InfoRow>
            )}

            <InfoRow label={labels("checkInTime")}>{gi("checkInTime")}</InfoRow>
            <InfoRow label={labels("checkOutTime")}>{gi("checkOutTime")}</InfoRow>
            <InfoRow label={labels("parking")}>{gi("parking")}</InfoRow>
            <InfoRow label={labels("keys")}>{gi("keys")}</InfoRow>

            {info.wifiNetwork && (
              <InfoRow label={labels("wifi")}>
                {labels("wifiNetwork")}: {info.wifiNetwork}
                {info.wifiPassword && <>, {labels("wifiPassword")}: {info.wifiPassword}</>}
              </InfoRow>
            )}

            {importantItems.length > 0 && (
              <InfoRow label={labels("important")}>
                <ul className="list-disc space-y-1 pl-5">
                  {importantItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </InfoRow>
            )}

            <InfoRow label={labels("contact")}>
              {labels("phone")}:{" "}
              <a href={`tel:${businessInfo.phone.replace(/\s/g, "")}`} className="text-accent transition-colors hover:text-dark">
                {businessInfo.phone}
              </a>
              <br />
              {labels("email")}:{" "}
              <a href={`mailto:${businessInfo.email}`} className="text-accent transition-colors hover:text-dark">
                {businessInfo.email}
              </a>
            </InfoRow>
          </div>
        </div>
      </section>
    </>
  )
}
