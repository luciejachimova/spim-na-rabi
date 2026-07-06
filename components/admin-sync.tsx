"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { ApartmentWithFeeds, IcalFeedRecord, IcalProvider } from "@/lib/reservations"

const inputClass =
  "w-full rounded-[2px] border border-mid/20 bg-pale px-3 py-2 text-sm text-dark outline-none focus:border-dark"

type FeedStatus = "ok" | "error" | "pending" | "unconfigured"

export function getFeedStatus(feed: IcalFeedRecord | undefined): FeedStatus {
  if (!feed) return "unconfigured"
  if (feed.lastSyncError) return "error"
  if (!feed.lastSyncedAt) return "pending"
  return "ok"
}

export function FeedStatusIcon({ status }: { status: FeedStatus }) {
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

// Minimal, dependency-free toast — a self-dismissing message in the corner.
function useToast() {
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(type: "success" | "error", message: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setToast({ type, message })
    timeoutRef.current = setTimeout(() => setToast(null), 5000)
  }

  const toastElement = toast ? (
    <div
      role="status"
      className={`fixed bottom-6 right-6 z-[300] max-w-sm rounded-[2px] px-4 py-3 text-sm text-cream shadow-lg ${
        toast.type === "error" ? "bg-accent" : "bg-dark"
      }`}
    >
      {toast.message}
    </div>
  ) : null

  return { showToast, toastElement }
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
  const { showToast, toastElement } = useToast()

  return (
    <div className="space-y-8">
      {apartments.map((apartment) => (
        <ApartmentSyncCard key={apartment.id} apartment={apartment} showToast={showToast} />
      ))}
      {toastElement}
    </div>
  )
}

function ApartmentSyncCard({
  apartment,
  showToast
}: {
  apartment: ApartmentWithFeeds
  showToast: (type: "success" | "error", message: string) => void
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
          `Synchronizace dokončena. Nové: ${payload.created}, aktualizované: ${payload.updated}, odstraněné: ${payload.deleted}.`
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
