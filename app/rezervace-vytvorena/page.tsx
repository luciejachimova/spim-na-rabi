import Link from "next/link"
import { getReservationByToken } from "@/lib/reservations"
import { toUtcDate } from "@/lib/prague-date"
import { PageHero } from "@/components/ui"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

function formatDisplayDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-")
  return `${Number(day)}. ${Number(month)}. ${year}`
}

function computeNights(startDate: string, endDate: string) {
  return Math.round((toUtcDate(endDate).getTime() - toUtcDate(startDate).getTime()) / 86_400_000)
}

export default async function ReservationCreatedPage({ searchParams }: PageProps) {
  const { token } = await searchParams
  const reservation = token ? await getReservationByToken(token) : null

  return (
    <>
      <PageHero label="Děkujeme" title="Rezervace byla úspěšně vytvořena" />

      <section className="py-24 md:py-[100px]">
        <div className="mx-auto max-w-[560px] px-8 text-center js-fade-in">
          {reservation ? (
            <>
              <p className="mb-8 text-[0.95rem] leading-relaxed text-mid">
                Potvrzení jsme odeslali na váš e-mail. Den před příjezdem vám pošleme informace k pobytu.
              </p>

              <div className="mb-10 space-y-3 border-y border-mid/10 py-8 text-left">
                <div className="flex justify-between">
                  <span className="text-mid">Apartmán</span>
                  <span className="text-dark">{reservation.apartmentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mid">Příjezd</span>
                  <span className="text-dark">{formatDisplayDate(reservation.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mid">Odjezd</span>
                  <span className="text-dark">{formatDisplayDate(reservation.endDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mid">Počet nocí</span>
                  <span className="text-dark">{computeNights(reservation.startDate, reservation.endDate)}</span>
                </div>
                {reservation.guests !== null && (
                  <div className="flex justify-between">
                    <span className="text-mid">Počet hostů</span>
                    <span className="text-dark">{reservation.guests}</span>
                  </div>
                )}
              </div>

              <Link
                href={`/reservation/${reservation.reservationToken}`}
                className="inline-block cursor-pointer rounded-[2px] border-none bg-dark px-10 py-[0.9rem] text-[0.78rem] font-medium uppercase tracking-[0.18em] text-cream transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent"
              >
                Zobrazit rezervaci
              </Link>
            </>
          ) : (
            <p className="text-[0.95rem] leading-relaxed text-mid">
              Rezervaci se nepodařilo dohledat. Pokud jste ji právě vytvořili, zkontrolujte prosím svůj e-mail
              s potvrzením.
            </p>
          )}
        </div>
      </section>
    </>
  )
}
