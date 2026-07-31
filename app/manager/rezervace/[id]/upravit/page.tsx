import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { updateReservationAction } from "@/app/manager/actions"
import ReservationForm from "@/components/manager/reservation-form"
import { prisma } from "@/lib/db"
import { addDaysToKey } from "@/lib/prague-date"
import { listBlockedRanges } from "@/lib/reservations/availability"
import { listApartmentOptions } from "@/lib/reservations/manager-data"
import { toReservationWithApartment } from "@/lib/reservations/mappers"

export const metadata: Metadata = { title: "Úprava rezervace | Spim Manager" }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditReservationPage({ params }: PageProps) {
  const { id } = await params
  const reservationId = Number(id)
  if (!Number.isInteger(reservationId)) notFound()

  const record = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { apartment: true }
  })
  if (!record) notFound()

  const reservation = toReservationWithApartment(record, record.apartment)

  const [apartments, blockedRanges] = await Promise.all([
    listApartmentOptions(),
    // Bounded, not unbounded. The stay being edited may sit in the past, so
    // "from today" is wrong here — but loading every reservation ever made to
    // warn about one clash grows without limit. A year back from this arrival
    // covers any date the form can realistically be moved to.
    listBlockedRanges({ fromDate: addDaysToKey(record.startDate, -365) })
  ])

  return (
    <div className="space-y-5">
      <div className="mx-auto max-w-xl">
        <Link href={`/manager/rezervace/${reservation.id}`} className="text-sm text-muted underline hover:text-dark">
          ← Zpět na detail
        </Link>
        <h1 className="mt-2 font-serif text-2xl">Úprava rezervace</h1>
      </div>

      <ReservationForm
        apartments={apartments}
        blockedRanges={blockedRanges}
        reservation={reservation}
        action={updateReservationAction}
        submitLabel="Uložit změny"
      />
    </div>
  )
}
