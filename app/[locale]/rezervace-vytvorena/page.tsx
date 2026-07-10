import { getTranslations, setRequestLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { getReservationByToken } from "@/lib/reservations"
import { formatReservationDate, toUtcDate } from "@/lib/prague-date"
import { PageHero } from "@/components/ui"
import { buildAlternates } from "@/lib/seo"
import type { Locale } from "@/i18n/routing"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ token?: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "meta" })

  return {
    title: t("reservationCreated.title"),
    description: t("reservationCreated.description"),
    alternates: buildAlternates(locale, "/rezervace-vytvorena"),
    robots: { index: false, follow: false }
  }
}

function computeNights(startDate: string, endDate: string) {
  return Math.round((toUtcDate(endDate).getTime() - toUtcDate(startDate).getTime()) / 86_400_000)
}

export default async function ReservationCreatedPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const { token } = await searchParams
  const reservation = token ? await getReservationByToken(token) : null

  const t = await getTranslations("reservationCreated")
  const labels = await getTranslations("labels")

  return (
    <>
      <PageHero label={t("heroLabel")} title={t("heroTitle")} />

      <section className="py-24 md:py-[100px]">
        <div className="mx-auto max-w-[560px] px-8 text-center js-fade-in">
          {reservation ? (
            <>
              <p className="mb-8 text-[0.95rem] leading-relaxed text-mid">{t("body")}</p>

              <div className="mb-10 space-y-3 border-y border-mid/10 py-8 text-left">
                <div className="flex justify-between">
                  <span className="text-mid">{labels("apartment")}</span>
                  <span className="text-dark">{reservation.apartmentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mid">{labels("checkIn")}</span>
                  <span className="text-dark">{formatReservationDate(reservation.startDate, locale)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mid">{labels("checkOut")}</span>
                  <span className="text-dark">{formatReservationDate(reservation.endDate, locale)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mid">{labels("nights")}</span>
                  <span className="text-dark">{computeNights(reservation.startDate, reservation.endDate)}</span>
                </div>
                {reservation.guests !== null && (
                  <div className="flex justify-between">
                    <span className="text-mid">{labels("guests")}</span>
                    <span className="text-dark">{reservation.guests}</span>
                  </div>
                )}
              </div>

              <Link
                href={{ pathname: "/reservation/[token]", params: { token: reservation.reservationToken as string } }}
                className="inline-block cursor-pointer rounded-[2px] border-none bg-dark px-10 py-[0.9rem] text-[0.78rem] font-medium uppercase tracking-[0.18em] text-cream transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent"
              >
                {t("viewButton")}
              </Link>
            </>
          ) : (
            <p className="text-[0.95rem] leading-relaxed text-mid">{t("notFound")}</p>
          )}
        </div>
      </section>
    </>
  )
}
