import { notFound } from "next/navigation"
import { getReservationByToken } from "@/lib/reservations"
import { toUtcDate } from "@/lib/prague-date"
import { getGuestInfo, businessInfo } from "@/data/guest-info"
import { PageHero } from "@/components/ui"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ token: string }>
}

function formatDisplayDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-")
  return `${Number(day)}. ${Number(month)}. ${year}`
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
  const { token } = await params
  const reservation = await getReservationByToken(token)

  if (!reservation || reservation.status !== "active") {
    notFound()
  }

  const info = getGuestInfo(reservation.apartmentSlug)
  const nights = computeNights(reservation.startDate, reservation.endDate)

  return (
    <>
      <PageHero label="Vaše rezervace" title={reservation.apartmentName} />

      <section className="py-24 md:py-[100px]">
        <div className="mx-auto max-w-[720px] px-8">
          <div className="js-fade-in">
            <InfoRow label="Příjezd">{formatDisplayDate(reservation.startDate)}</InfoRow>
            <InfoRow label="Odjezd">{formatDisplayDate(reservation.endDate)}</InfoRow>
            <InfoRow label="Počet nocí">{nights}</InfoRow>
            {reservation.guests !== null && <InfoRow label="Počet hostů">{reservation.guests}</InfoRow>}

            {info.address && (
              <InfoRow label="Adresa">
                {info.address}
                {info.googleMapsUrl && (
                  <>
                    {" "}
                    ·{" "}
                    <a href={info.googleMapsUrl} className="text-accent transition-colors hover:text-dark">
                      otevřít v Google Maps
                    </a>
                  </>
                )}
              </InfoRow>
            )}

            {info.checkInTime && <InfoRow label="Check-in">od {info.checkInTime}</InfoRow>}
            {info.checkOutTime && <InfoRow label="Check-out">do {info.checkOutTime}</InfoRow>}
            {info.parkingInfo && <InfoRow label="Parkování">{info.parkingInfo}</InfoRow>}
            {info.keyInstructions && <InfoRow label="Převzetí klíčů">{info.keyInstructions}</InfoRow>}

            {info.wifiNetwork && (
              <InfoRow label="Wifi">
                Síť: {info.wifiNetwork}
                {info.wifiPassword && <>, heslo: {info.wifiPassword}</>}
              </InfoRow>
            )}

            {info.importantInfo && <InfoRow label="Důležité informace">{info.importantInfo}</InfoRow>}

            <InfoRow label="Kontakt">
              Telefon:{" "}
              <a href={`tel:${businessInfo.phone.replace(/\s/g, "")}`} className="text-accent transition-colors hover:text-dark">
                {businessInfo.phone}
              </a>
              <br />
              E-mail:{" "}
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
