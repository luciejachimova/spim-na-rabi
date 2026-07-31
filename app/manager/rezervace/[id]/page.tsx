import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cancelReservationAction } from "@/app/manager/actions"
import { StatusBadge } from "@/components/manager/reservation-list"
import { SOURCE_LABELS } from "@/lib/reservations/status"
import { prisma } from "@/lib/db"
import { formatDate, formatDateRange, formatDateTime, formatDogs, formatGuests, formatMoney, formatNights } from "@/lib/format"
import { toReservationWithApartment } from "@/lib/reservations/mappers"
import { countNights } from "@/lib/reservations/overlap"
import { isBlocking } from "@/lib/reservations/status"

export const metadata: Metadata = { title: "Detail rezervace | Spim Manager" }

interface PageProps {
  params: Promise<{ id: string }>
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 border-b border-dark/8 py-2 last:border-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm">{value}</dd>
    </div>
  )
}

const EMAIL_STEPS = [
  { label: "Potvrzení", key: "confirmationEmailedAt" },
  { label: "Info před příjezdem", key: "arrivalInfoEmailedAt" },
  { label: "Připomínka odjezdu", key: "departureReminderEmailedAt" },
  { label: "Poděkování", key: "thankYouEmailedAt" }
] as const

export default async function ReservationDetailPage({ params }: PageProps) {
  const { id } = await params
  const reservationId = Number(id)
  if (!Number.isInteger(reservationId)) notFound()

  const record = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { apartment: true, guest: true }
  })
  if (!record) notFound()

  const reservation = toReservationWithApartment(record, record.apartment)
  const nights = countNights(reservation.startDate, reservation.endDate)
  const dogs = formatDogs(reservation.hasDog, reservation.dogsCount)
  const isBlock = reservation.source === "admin_block"
  const isExternal = reservation.source === "booking" || reservation.source === "airbnb"
  const needsDetails = isExternal && !reservation.phone && !reservation.email

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <Link href="/manager/rezervace" className="text-sm text-muted underline hover:text-dark">
          ← Zpět na rezervace
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-2xl">
            {isBlock ? "Blokace" : reservation.name || "Rezervace bez jména"}
          </h1>
          <StatusBadge status={reservation.status} />
        </div>
        <p className="mt-1 text-muted">
          <span style={{ color: record.apartment.color }}>■</span> {reservation.apartmentName} ·{" "}
          {formatDateRange(reservation.startDate, reservation.endDate)}
          {nights > 0 && ` · ${formatNights(nights)}`}
        </p>
      </div>

      {needsDetails && (
        <p className="rounded-[2px] border border-alert/50 bg-alert/10 px-3 py-2.5 text-sm">
          Rezervace přišla z {SOURCE_LABELS[reservation.source]} — kanál neposílá kontakt ani cenu.{" "}
          <Link href={`/manager/rezervace/${reservation.id}/upravit`} className="underline">
            Doplnit údaje
          </Link>
        </p>
      )}

      {!isBlock && (reservation.phone || reservation.email) && (
        <div className="flex flex-wrap gap-2">
          {reservation.phone && (
            <a
              href={`tel:${reservation.phone.replace(/\s/g, "")}`}
              className="flex-1 cursor-pointer rounded-[2px] bg-dark px-4 py-3 text-center text-sm uppercase tracking-wide text-sand transition-colors hover:bg-alert"
            >
              Zavolat
            </a>
          )}
          {reservation.phone && (
            <a
              href={`sms:${reservation.phone.replace(/\s/g, "")}`}
              className="flex-1 cursor-pointer rounded-[2px] border border-dark/20 px-4 py-3 text-center text-sm uppercase tracking-wide transition-colors hover:border-dark"
            >
              SMS
            </a>
          )}
          {reservation.email && (
            <a
              href={`mailto:${reservation.email}`}
              className="flex-1 cursor-pointer rounded-[2px] border border-dark/20 px-4 py-3 text-center text-sm uppercase tracking-wide transition-colors hover:border-dark"
            >
              E-mail
            </a>
          )}
        </div>
      )}

      <dl className="rounded-[2px] border border-dark/10 bg-white px-3 py-1">
        <Row label="Apartmán" value={reservation.apartmentName} />
        <Row label="Příjezd" value={`${formatDate(reservation.startDate)}${reservation.arrivalTime ? ` v ${reservation.arrivalTime}` : ` od ${record.apartment.checkInFrom}`}`} />
        <Row label="Odjezd" value={`${formatDate(reservation.endDate)}${reservation.departureTime ? ` v ${reservation.departureTime}` : ` do ${record.apartment.checkOutUntil}`}`} />
        <Row label="Zdroj" value={SOURCE_LABELS[reservation.source]} />
        {!isBlock && (
          <>
            <Row label="Telefon" value={reservation.phone} />
            <Row label="E-mail" value={reservation.email} />
            <Row label="Hosté" value={formatGuests(reservation.adults, reservation.children)} />
            <Row label="Věk dětí" value={reservation.childrenAges} />
            <Row label="Pes" value={dogs} />
            <Row
              label="Cena"
              value={
                formatMoney(reservation.priceCents, reservation.currency) && (
                  <>
                    {formatMoney(reservation.priceCents, reservation.currency)}
                    <span className={reservation.isPaid ? "text-muted" : "text-alert"}>
                      {reservation.isPaid ? " · zaplaceno" : " · nezaplaceno"}
                    </span>
                  </>
                )
              }
            />
            <Row label="Záloha" value={formatMoney(reservation.depositCents, reservation.currency)} />
            <Row label="Poznámka od hosta" value={reservation.guestNote} />
          </>
        )}
        <Row label="Interní poznámka" value={reservation.note} />
        {reservation.status === "cancelled" && (
          <>
            <Row label="Zrušeno" value={reservation.cancelledAt ? formatDateTime(reservation.cancelledAt) : null} />
            <Row label="Důvod storna" value={reservation.cancelReason} />
          </>
        )}
        {record.guest && (
          <Row
            label="Host v adresáři"
            value={
              <Link href={`/manager/hoste/${record.guest.id}`} className="underline">
                {record.guest.name}
              </Link>
            }
          />
        )}
      </dl>

      {!isBlock && reservation.email && (
        <div className="rounded-[2px] border border-dark/10 bg-white px-3 py-1">
          <p className="border-b border-dark/8 py-2 text-xs uppercase tracking-[0.14em] text-muted">E-maily hostovi</p>
          {EMAIL_STEPS.map((step) => {
            const sentAt = reservation[step.key]
            return (
              <Row
                key={step.key}
                label={step.label}
                value={sentAt ? formatDateTime(sentAt) : <span className="text-muted">neodesláno</span>}
              />
            )
          })}
        </div>
      )}

      <div className="rounded-[2px] border border-dark/10 bg-white px-3 py-1">
        <Row label="Vytvořeno" value={formatDateTime(reservation.createdAt)} />
        <Row label="Naposledy upraveno" value={formatDateTime(reservation.updatedAt)} />
        {reservation.lastSyncedAt && <Row label="Poslední synchronizace" value={formatDateTime(reservation.lastSyncedAt)} />}
        {reservation.manualEditedAt && <Row label="Ruční úprava" value={formatDateTime(reservation.manualEditedAt)} />}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/manager/rezervace/${reservation.id}/upravit`}
          className="flex-1 cursor-pointer rounded-[2px] bg-dark px-4 py-3 text-center text-sm uppercase tracking-wide text-sand transition-colors hover:bg-alert"
        >
          Upravit
        </Link>
        {isBlocking(reservation.status) && (
          <form action={cancelReservationAction} className="flex-1">
            <input type="hidden" name="reservationId" value={reservation.id} />
            <input type="hidden" name="reason" value="manual" />
            <button
              type="submit"
              className="w-full cursor-pointer rounded-[2px] border border-alert/50 px-4 py-3 text-sm uppercase tracking-wide text-alert transition-colors hover:bg-alert/10"
            >
              Stornovat
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
