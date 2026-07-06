"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { ApartmentWithFeeds, ReservationWithApartment } from "@/lib/reservations"
import { FeedStatusIcon, getFeedStatus } from "./admin-sync"

const SOURCE_LABELS: Record<string, string> = {
  website: "Web",
  booking: "Booking.com",
  airbnb: "Airbnb",
  admin_block: "Blokováno majitelem"
}

const inputClass = "rounded-[2px] border border-mid/20 bg-pale px-3 py-2 text-sm text-dark outline-none focus:border-dark"

interface Props {
  reservations: ReservationWithApartment[]
  apartments: ApartmentWithFeeds[]
}

export default function AdminDashboard({ reservations, apartments }: Props) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)

  async function handleCancel(id: number) {
    setPendingId(id)
    setCancelError(null)

    try {
      const response = await fetch(`/api/admin/reservations/${id}`, { method: "PATCH" })
      const payload = await response.json()

      if (!response.ok) {
        setCancelError(payload.error || "Rezervaci se nepodařilo zrušit.")
        return
      }

      router.refresh()
    } finally {
      setPendingId(null)
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-10 font-jost text-dark">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Administrace rezervací</h1>
        <button type="button" onClick={handleLogout} className="cursor-pointer text-sm text-mid underline hover:text-dark">
          Odhlásit se
        </button>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-medium">Rezervace</h2>
        {cancelError && <p className="mb-2 text-sm text-accent">{cancelError}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-light text-left text-xs uppercase tracking-wide text-mid">
                <th className="py-2 pr-4">Apartmán</th>
                <th className="py-2 pr-4">Termín</th>
                <th className="py-2 pr-4">Jméno</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Poznámka</th>
                <th className="py-2 pr-4">Zdroj</th>
                <th className="py-2 pr-4">Stav</th>
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id} className="border-b border-light/60">
                  <td className="py-2 pr-4">{reservation.apartmentName}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {reservation.startDate} – {reservation.endDate}
                  </td>
                  <td className="py-2 pr-4">{reservation.name || "-"}</td>
                  <td className="py-2 pr-4">{reservation.email || "-"}</td>
                  <td className="py-2 pr-4">{reservation.note || "-"}</td>
                  <td className="py-2 pr-4">{SOURCE_LABELS[reservation.source] || reservation.source}</td>
                  <td className="py-2 pr-4">{reservation.status === "active" ? "Aktivní" : "Zrušená"}</td>
                  <td className="py-2 pr-4">
                    {reservation.status === "active" && (
                      <button
                        type="button"
                        onClick={() => handleCancel(reservation.id)}
                        disabled={pendingId === reservation.id}
                        className="cursor-pointer text-accent underline disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Zrušit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {reservations.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-4 text-mid">
                    Žádné rezervace.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <BlockForm apartments={apartments} onCreated={() => router.refresh()} />
      <SyncSummary apartments={apartments} />
    </div>
  )
}

function SyncSummary({ apartments }: { apartments: ApartmentWithFeeds[] }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-medium">Poslední synchronizace</h2>
        <Link href="/admin/sync" className="text-sm text-mid underline hover:text-dark">
          Spravovat kalendáře →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-light text-left text-xs uppercase tracking-wide text-mid">
              <th className="py-2 pr-4">Apartmán</th>
              <th className="py-2 pr-4">Booking</th>
              <th className="py-2 pr-4">Airbnb</th>
              <th className="py-2 pr-4">Poslední synchronizace</th>
              <th className="py-2 pr-4">Stav</th>
            </tr>
          </thead>
          <tbody>
            {apartments.map((apartment) => {
              const bookingFeed = apartment.icalFeeds.find((feed) => feed.provider === "booking")
              const airbnbFeed = apartment.icalFeeds.find((feed) => feed.provider === "airbnb")
              const lastSyncedAt = [bookingFeed?.lastSyncedAt, airbnbFeed?.lastSyncedAt]
                .filter((value): value is string => Boolean(value))
                .sort()
                .at(-1)
              const statuses = apartment.icalFeeds.map(getFeedStatus)
              const overallStatus = statuses.some((status) => status === "error")
                ? "error"
                : statuses.length === 0
                  ? "unconfigured"
                  : statuses.every((status) => status === "ok")
                    ? "ok"
                    : "pending"

              return (
                <tr key={apartment.id} className="border-b border-light/60">
                  <td className="py-2 pr-4">{apartment.name}</td>
                  <td className="py-2 pr-4">
                    <FeedStatusIcon status={getFeedStatus(bookingFeed)} />
                  </td>
                  <td className="py-2 pr-4">
                    <FeedStatusIcon status={getFeedStatus(airbnbFeed)} />
                  </td>
                  <td className="py-2 pr-4">{lastSyncedAt ? new Date(lastSyncedAt).toLocaleString("cs-CZ") : "Nikdy"}</td>
                  <td className="py-2 pr-4">
                    <FeedStatusIcon status={overallStatus} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function BlockForm({ apartments, onCreated }: { apartments: ApartmentWithFeeds[]; onCreated: () => void }) {
  const [status, setStatus] = useState<{ type: "error" | "success"; message: string } | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <section>
      <h2 className="mb-4 text-xl font-medium">Zablokovat termín</h2>
      <form
        className="grid grid-cols-1 gap-3 md:grid-cols-4"
        onSubmit={async (event) => {
          event.preventDefault()
          setLoading(true)
          setStatus(null)
          const form = event.currentTarget
          const data = Object.fromEntries(new FormData(form).entries())

          try {
            const response = await fetch("/api/admin/block", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...data, apartmentId: Number(data.apartmentId) })
            })
            const payload = await response.json()

            if (!response.ok) {
              setStatus({ type: "error", message: payload.error || "Blokaci se nepodařilo vytvořit." })
              return
            }

            setStatus({ type: "success", message: "Termín byl zablokován." })
            form.reset()
            onCreated()
          } finally {
            setLoading(false)
          }
        }}
      >
        <select name="apartmentId" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Apartmán
          </option>
          {apartments.map((apartment) => (
            <option key={apartment.id} value={apartment.id}>
              {apartment.name}
            </option>
          ))}
        </select>
        <input type="date" name="startDate" required className={inputClass} />
        <input type="date" name="endDate" required className={inputClass} />
        <input type="text" name="note" placeholder="Poznámka (např. dovolená)" className={inputClass} />
        <button
          type="submit"
          disabled={loading}
          className="col-span-full w-fit cursor-pointer rounded-[2px] bg-dark px-6 py-2 text-sm uppercase tracking-wide text-cream transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          Zablokovat
        </button>
      </form>
      {status && <p className={`mt-2 text-sm ${status.type === "error" ? "text-accent" : "text-dark"}`}>{status.message}</p>}
    </section>
  )
}

