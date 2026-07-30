import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { updateGuestNoteAction } from "@/app/manager/actions"
import { StatusBadge } from "@/components/manager/reservation-list"
import { SOURCE_LABELS } from "@/components/reservation-detail-modal"
import { formatDate, formatDateRange, formatDogs, formatGuests, formatMoney, formatNights } from "@/lib/format"
import { getGuestDetail } from "@/lib/reservations/guests"

export const metadata: Metadata = { title: "Detail hosta | Spim Manager" }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function GuestDetailPage({ params }: PageProps) {
  const { id } = await params
  const guest = await getGuestDetail(id)
  if (!guest) notFound()

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <Link href="/manager/hoste" className="text-sm text-mid underline hover:text-dark">
          ← Zpět na hosty
        </Link>
        <h1 className="mt-2 font-serif text-2xl">{guest.name}</h1>
        <p className="mt-1 text-mid">
          {guest.stayCount === 0
            ? "zatím bez dokončeného pobytu"
            : `${guest.stayCount}× u nás · ${guest.nightCount} nocí${
                guest.totalCents > 0 ? ` · ${formatMoney(guest.totalCents, guest.currency)}` : ""
              }`}
        </p>
      </div>

      {(guest.phone || guest.email) && (
        <div className="flex flex-wrap gap-2">
          {guest.phone && (
            <a
              href={`tel:${guest.phone.replace(/\s/g, "")}`}
              className="flex-1 cursor-pointer rounded-[2px] bg-dark px-4 py-3 text-center text-sm uppercase tracking-wide text-sand transition-colors hover:bg-accent"
            >
              Zavolat
            </a>
          )}
          {guest.email && (
            <a
              href={`mailto:${guest.email}`}
              className="flex-1 cursor-pointer rounded-[2px] border border-dark/20 px-4 py-3 text-center text-sm uppercase tracking-wide transition-colors hover:border-dark"
            >
              E-mail
            </a>
          )}
        </div>
      )}

      <dl className="rounded-[2px] border border-dark/10 bg-white px-3 py-1">
        {guest.phone && (
          <div className="flex justify-between gap-4 border-b border-dark/8 py-2">
            <dt className="text-sm text-mid">Telefon</dt>
            <dd className="text-sm">{guest.phone}</dd>
          </div>
        )}
        {guest.email && (
          <div className="flex justify-between gap-4 border-b border-dark/8 py-2">
            <dt className="text-sm text-mid">E-mail</dt>
            <dd className="text-sm break-all">{guest.email}</dd>
          </div>
        )}
        {guest.firstStayDate && (
          <div className="flex justify-between gap-4 py-2">
            <dt className="text-sm text-mid">První pobyt</dt>
            <dd className="text-sm">{formatDate(guest.firstStayDate)}</dd>
          </div>
        )}
      </dl>

      <form action={updateGuestNoteAction} className="space-y-2">
        <input type="hidden" name="guestId" value={guest.id} />
        <label className="block text-xs uppercase tracking-wide text-mid" htmlFor="note">
          Interní poznámka
        </label>
        {/* Never shown to the guest — this is the place for "tichý, vrací se"
            or "hlučný pes", which is what makes the address book worth keeping. */}
        <textarea
          id="note"
          name="note"
          rows={2}
          defaultValue={guest.note ?? ""}
          placeholder="např. tichý, vrací se každý rok"
          className="w-full resize-y rounded-[2px] border border-dark/15 bg-white px-3 py-2.5 text-base outline-none focus:border-dark"
        />
        <button
          type="submit"
          className="cursor-pointer rounded-[2px] border border-dark/20 px-4 py-2 text-sm uppercase tracking-wide text-mid transition-colors hover:border-dark hover:text-dark"
        >
          Uložit poznámku
        </button>
      </form>

      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-[0.14em] text-mid">Pobyty</h2>
        <ul className="space-y-2">
          {guest.stays.map((stay) => {
            const dogs = formatDogs(stay.hasDog, stay.dogsCount)
            return (
              <li key={stay.reservationId}>
                <Link
                  href={`/manager/rezervace/${stay.reservationId}`}
                  className="block rounded-[2px] border border-dark/10 bg-white p-3 transition-colors hover:border-dark/30"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="text-sm">
                      {stay.apartmentName} · {formatDateRange(stay.startDate, stay.endDate)}
                    </span>
                    <StatusBadge status={stay.status} />
                  </div>
                  <p className="text-sm text-mid">
                    {formatNights(stay.nights)} · {formatGuests(stay.adults, stay.children)}
                    {dogs && ` · ${dogs}`}
                    {formatMoney(stay.priceCents, stay.currency) && ` · ${formatMoney(stay.priceCents, stay.currency)}`}
                    {` · ${SOURCE_LABELS[stay.source]}`}
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
