"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { formatDate, formatMoney } from "@/lib/format"
import type { GuestSummary } from "@/lib/reservations/guests"

export default function GuestList({ guests }: { guests: GuestSummary[] }) {
  const [search, setSearch] = useState("")
  const [returningOnly, setReturningOnly] = useState(false)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return guests.filter((guest) => {
      if (returningOnly && !guest.isReturning) return false
      if (!query) return true
      return [guest.name, guest.email, guest.phone, guest.note].filter(Boolean).join(" ").toLowerCase().includes(query)
    })
  }, [guests, search, returningOnly])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Jméno, e-mail, telefon…"
          className="min-w-[12rem] flex-1 rounded-[2px] border border-dark/15 bg-white px-2.5 py-2 text-sm outline-none focus:border-dark"
        />
        <label className="flex cursor-pointer items-center gap-2 rounded-[2px] border border-dark/15 bg-white px-2.5 py-2 text-sm">
          <input
            type="checkbox"
            checked={returningOnly}
            onChange={(event) => setReturningOnly(event.target.checked)}
            className="h-4 w-4 cursor-pointer accent-dark"
          />
          Jen vracející se
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted">
          {guests.length === 0
            ? "Adresář je zatím prázdný. Host se do něj přidá sám, jakmile u rezervace vyplníte e-mail nebo telefon."
            : "Žádný host neodpovídá filtru."}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((guest) => (
            <li key={guest.id}>
              <Link
                href={`/manager/hoste/${guest.id}`}
                className="block rounded-[2px] border border-dark/10 bg-white p-3 transition-colors hover:border-dark/30"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="text-base">{guest.name}</span>
                  <span className="flex gap-1.5">
                    {guest.hasUpcomingStay && (
                      <span className="rounded-[2px] bg-dark px-1.5 py-0.5 text-[11px] tracking-wide text-sand">Přijede</span>
                    )}
                    {guest.isReturning && (
                      <span className="rounded-[2px] bg-alert/20 px-1.5 py-0.5 text-[11px] tracking-wide">Vrací se</span>
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted">{[guest.phone, guest.email].filter(Boolean).join(" · ") || "bez kontaktu"}</p>
                <p className="text-sm text-muted">
                  {guest.stayCount === 0
                    ? "zatím bez pobytu"
                    : `${guest.stayCount}× · ${guest.nightCount} nocí${
                        guest.totalCents > 0 ? ` · ${formatMoney(guest.totalCents, guest.currency)}` : ""
                      }`}
                  {guest.lastStayDate && ` · naposledy ${formatDate(guest.lastStayDate)}`}
                </p>
                {guest.note && <p className="mt-1 truncate text-sm text-muted italic">{guest.note}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
