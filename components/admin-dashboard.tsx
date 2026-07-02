"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ApartmentWithFeeds, IcalProvider, ReservationWithApartment } from "@/lib/reservations"

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
      <FeedsEditor apartments={apartments} onSaved={() => router.refresh()} />
    </div>
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

function FeedsEditor({ apartments, onSaved }: { apartments: ApartmentWithFeeds[]; onSaved: () => void }) {
  const [status, setStatus] = useState<{ type: "error" | "success"; message: string } | null>(null)

  async function handleSubmit(apartmentId: number, provider: IcalProvider, url: string) {
    setStatus(null)

    const response = await fetch("/api/admin/feeds", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apartmentId, provider, url })
    })
    const payload = await response.json()

    if (!response.ok) {
      setStatus({ type: "error", message: payload.error || "Feed se nepodařilo uložit." })
      return
    }

    setStatus({ type: "success", message: "Feed byl uložen." })
    onSaved()
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-medium">iCal feedy (Booking.com / Airbnb)</h2>
      <div className="space-y-6">
        {apartments.map((apartment) => (
          <div key={apartment.id} className="space-y-2">
            <p className="font-medium">{apartment.name}</p>
            {(["booking", "airbnb"] as const).map((provider) => {
              const existing = apartment.icalFeeds.find((feed) => feed.provider === provider)

              return (
                <form
                  key={provider}
                  className="flex flex-wrap items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const url = new FormData(event.currentTarget).get("url")
                    if (typeof url === "string" && url.trim()) {
                      handleSubmit(apartment.id, provider, url.trim())
                    }
                  }}
                >
                  <span className="w-24 text-xs uppercase tracking-wide text-mid">
                    {provider === "booking" ? "Booking.com" : "Airbnb"}
                  </span>
                  <input
                    type="url"
                    name="url"
                    defaultValue={existing?.url || ""}
                    placeholder="https://..."
                    className={`min-w-[280px] flex-1 ${inputClass}`}
                  />
                  <button
                    type="submit"
                    className="cursor-pointer rounded-[2px] border border-dark px-3 py-1.5 text-xs uppercase tracking-wide hover:bg-dark hover:text-cream"
                  >
                    Uložit
                  </button>
                  {existing?.lastSyncedAt && (
                    <span className="text-xs text-mid">Naposledy: {new Date(existing.lastSyncedAt).toLocaleString("cs-CZ")}</span>
                  )}
                  {existing?.lastSyncError && <span className="text-xs text-accent">{existing.lastSyncError}</span>}
                </form>
              )
            })}
          </div>
        ))}
      </div>
      {status && <p className={`mt-2 text-sm ${status.type === "error" ? "text-accent" : "text-dark"}`}>{status.message}</p>}
    </section>
  )
}
