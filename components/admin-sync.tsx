"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ApartmentWithFeeds, IcalFeedRecord, IcalProvider } from "@/lib/reservations"
import { getFeedStatus } from "@/lib/feed-status"
import { useToast } from "./admin-toast"
import { useConfirm } from "./confirm-dialog"

const inputClass =
  "w-full rounded-[2px] border border-mid/20 bg-pale px-3 py-2 text-sm text-dark outline-none focus:border-dark"

export function FeedStatusIcon({ status }: { status: ReturnType<typeof getFeedStatus> }) {
  if (status === "ok") {
    return (
      <span title="Poslední synchronizace proběhla v pořádku" className="inline-block h-2.5 w-2.5 rounded-full bg-green-600" />
    )
  }
  if (status === "error") {
    return <span title="Poslední synchronizace selhala" className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" />
  }
  if (status === "pending") {
    return <span title="Ještě nebylo synchronizováno" className="inline-block h-2.5 w-2.5 rounded-full bg-mid/40" />
  }
  return <span title="Nenastaveno" className="inline-block h-2.5 w-2.5 rounded-full border border-mid/40" />
}

function formatDateTime(value: string | null) {
  if (!value) return "Nikdy"
  return new Date(value).toLocaleString("cs-CZ")
}

function validateFeedUrl(provider: IcalProvider, url: string): string | null {
  if (!url) return null
  if (!/^https?:\/\//i.test(url)) {
    return "URL musí začínat http:// nebo https://."
  }
  if (provider === "booking" && !/booking/i.test(url)) {
    return "Booking.com URL musí obsahovat „booking“."
  }
  if (provider === "airbnb" && !/airbnb/i.test(url)) {
    return "Airbnb URL musí obsahovat „airbnb“."
  }
  return null
}

interface Props {
  apartments: ApartmentWithFeeds[]
}

export default function AdminSync({ apartments }: Props) {
  const router = useRouter()
  const { showToast, toastElement } = useToast()
  const { confirm, confirmDialog } = useConfirm()
  const [syncingAll, setSyncingAll] = useState(false)

  async function handleSyncAll() {
    const confirmed = await confirm({
      title: "Synchronizovat všechny apartmány?",
      message: "Stáhnou se aktuální rezervace z Booking.com a Airbnb pro všechny apartmány.",
      confirmLabel: "Synchronizovat vše"
    })
    if (!confirmed) return

    setSyncingAll(true)
    try {
      const response = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      })
      const payload = await response.json()

      if (!response.ok) {
        showToast("error", payload.error || "Synchronizaci se nepodařilo spustit.")
        return
      }

      if (payload.error) {
        showToast("error", payload.error)
      } else {
        showToast(
          "success",
          `Synchronizace dokončena. Nové: ${payload.created}, aktualizované: ${payload.updated}, zrušené: ${payload.cancelled}.`
        )
      }

      router.refresh()
    } catch {
      showToast("error", "Synchronizaci se nepodařilo spustit.")
    } finally {
      setSyncingAll(false)
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSyncAll}
          disabled={syncingAll}
          className="cursor-pointer rounded-[2px] bg-dark px-5 py-2 text-sm uppercase tracking-wide text-cream transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {syncingAll ? "Synchronizuji…" : "Synchronizovat vše"}
        </button>
      </div>
      <SyncSummary apartments={apartments} />
      <BlockForm apartments={apartments} onCreated={() => router.refresh()} confirm={confirm} />
      <div className="space-y-8">
        {apartments.map((apartment) => (
          <ApartmentSyncCard key={apartment.id} apartment={apartment} showToast={showToast} confirm={confirm} />
        ))}
      </div>
      {toastElement}
      {confirmDialog}
    </div>
  )
}

function SyncSummary({ apartments }: { apartments: ApartmentWithFeeds[] }) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-medium">Poslední synchronizace</h2>
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

function BlockForm({
  apartments,
  onCreated,
  confirm
}: {
  apartments: ApartmentWithFeeds[]
  onCreated: () => void
  confirm: (options: { title: string; message: string; confirmLabel?: string }) => Promise<boolean>
}) {
  const [status, setStatus] = useState<{ type: "error" | "success"; message: string } | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <section>
      <h2 className="mb-4 text-xl font-medium">Zablokovat termín</h2>
      <form
        className="grid grid-cols-1 gap-3 md:grid-cols-4"
        onSubmit={async (event) => {
          event.preventDefault()
          const form = event.currentTarget
          const data = Object.fromEntries(new FormData(form).entries())

          const confirmed = await confirm({
            title: "Zablokovat termín?",
            message: `Termín ${data.startDate} – ${data.endDate} bude označen jako obsazený.`,
            confirmLabel: "Zablokovat"
          })
          if (!confirmed) return

          setLoading(true)
          setStatus(null)

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

function ApartmentSyncCard({
  apartment,
  showToast,
  confirm
}: {
  apartment: ApartmentWithFeeds
  showToast: (type: "success" | "error", message: string) => void
  confirm: (options: { title: string; message: string; confirmLabel?: string }) => Promise<boolean>
}) {
  const router = useRouter()
  const bookingFeed = apartment.icalFeeds.find((feed) => feed.provider === "booking")
  const airbnbFeed = apartment.icalFeeds.find((feed) => feed.provider === "airbnb")

  const [bookingUrl, setBookingUrl] = useState(bookingFeed?.url || "")
  const [airbnbUrl, setAirbnbUrl] = useState(airbnbFeed?.url || "")
  const [fieldErrors, setFieldErrors] = useState<{ booking?: string; airbnb?: string }>({})
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(apartment.publicIcalUrl || "")
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast("error", "Kopírování se nepodařilo — zkopírujte odkaz ručně.")
    }
  }

  async function handleSave() {
    const bookingError = validateFeedUrl("booking", bookingUrl.trim())
    const airbnbError = validateFeedUrl("airbnb", airbnbUrl.trim())

    setFieldErrors({ booking: bookingError || undefined, airbnb: airbnbError || undefined })
    if (bookingError || airbnbError) {
      return
    }

    setSaving(true)
    try {
      const saves: Promise<Response>[] = []

      if (bookingUrl.trim()) {
        saves.push(
          fetch("/api/admin/ical-feeds", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apartmentId: apartment.id, provider: "booking", url: bookingUrl.trim() })
          })
        )
      }

      if (airbnbUrl.trim()) {
        saves.push(
          fetch("/api/admin/ical-feeds", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apartmentId: apartment.id, provider: "airbnb", url: airbnbUrl.trim() })
          })
        )
      }

      if (saves.length === 0) {
        showToast("error", "Vyplňte alespoň jednu URL.")
        return
      }

      const responses = await Promise.all(saves)
      const payloads = await Promise.all(responses.map((response) => response.json().catch(() => ({}))))

      const failedIndex = responses.findIndex((response) => !response.ok)
      if (failedIndex !== -1) {
        showToast("error", payloads[failedIndex]?.error || "Synchronizační odkaz se nepodařilo uložit.")
        return
      }

      showToast("success", "Synchronizační odkaz byl uložen.")
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleSyncNow() {
    const confirmed = await confirm({
      title: "Spustit synchronizaci?",
      message: `Stáhnou se aktuální rezervace z Booking.com a Airbnb pro ${apartment.name}.`,
      confirmLabel: "Synchronizovat"
    })
    if (!confirmed) return

    setSyncing(true)
    try {
      const response = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apartmentId: apartment.id })
      })
      const payload = await response.json()

      if (!response.ok) {
        showToast("error", payload.error || "Synchronizaci se nepodařilo spustit.")
        return
      }

      if (payload.error) {
        showToast("error", payload.error)
      } else {
        showToast(
          "success",
          `Synchronizace dokončena. Nové: ${payload.created}, aktualizované: ${payload.updated}, zrušené: ${payload.cancelled}.`
        )
      }

      router.refresh()
    } catch {
      showToast("error", "Synchronizaci se nepodařilo spustit.")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <section className="space-y-5 rounded-[2px] border border-mid/20 bg-pale/40 p-5">
      <h2 className="font-serif text-xl">{apartment.name}</h2>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-mid">Veřejný iCal odkaz (export z našeho webu)</label>
        <div className="flex items-center gap-2">
          <input type="text" readOnly value={apartment.publicIcalUrl || ""} className={`${inputClass} bg-cream/60`} />
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 cursor-pointer rounded-[2px] border border-dark px-3 py-2 text-xs uppercase tracking-wide hover:bg-dark hover:text-cream"
          >
            {copied ? "Zkopírováno" : "Kopírovat"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FeedField
          label="Booking.com iCal URL"
          value={bookingUrl}
          onChange={setBookingUrl}
          error={fieldErrors.booking}
          feed={bookingFeed}
        />
        <FeedField label="Airbnb iCal URL" value={airbnbUrl} onChange={setAirbnbUrl} error={fieldErrors.airbnb} feed={airbnbFeed} />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="cursor-pointer rounded-[2px] bg-dark px-5 py-2 text-sm uppercase tracking-wide text-cream transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Ukládám…" : "Uložit"}
        </button>
        <button
          type="button"
          onClick={handleSyncNow}
          disabled={syncing}
          className="cursor-pointer rounded-[2px] border border-dark px-5 py-2 text-sm uppercase tracking-wide transition-colors hover:bg-dark hover:text-cream disabled:cursor-not-allowed disabled:opacity-60"
        >
          {syncing ? "Synchronizuji…" : "Synchronizovat nyní"}
        </button>
      </div>
    </section>
  )
}

function FeedField({
  label,
  value,
  onChange,
  error,
  feed
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  feed: IcalFeedRecord | undefined
}) {
  const status = getFeedStatus(feed)

  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-mid">{label}</label>
      <input
        type="url"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://..."
        className={inputClass}
      />
      {error && <p className="mt-1 text-xs text-accent">{error}</p>}
      <div className="mt-1 flex items-center gap-2 text-xs text-mid">
        <FeedStatusIcon status={status} />
        <span>Poslední synchronizace: {formatDateTime(feed?.lastSyncedAt ?? null)}</span>
      </div>
      {feed?.lastSyncError && <p className="mt-1 text-xs text-accent">{feed.lastSyncError}</p>}
    </div>
  )
}
