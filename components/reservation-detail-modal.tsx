"use client"

import { useState } from "react"
import { describeReservationStatus, SOURCE_LABELS } from "@/lib/reservations/status"
import type { ReservationWithApartment } from "@/lib/reservations"

// Re-exported for the admin components that already import it from here.
export { SOURCE_LABELS }
import type { EmailKind } from "@/lib/guest-emails"

const EMAIL_KINDS: {
  kind: EmailKind
  label: string
  sentAtField: keyof ReservationWithApartment
  attemptsField: keyof ReservationWithApartment
}[] = [
  { kind: "confirmation", label: "Potvrzení rezervace", sentAtField: "confirmationEmailedAt", attemptsField: "confirmationEmailAttempts" },
  { kind: "arrivalInfo", label: "Informace k příjezdu", sentAtField: "arrivalInfoEmailedAt", attemptsField: "arrivalInfoEmailAttempts" },
  {
    kind: "departureReminder",
    label: "Připomenutí odjezdu",
    sentAtField: "departureReminderEmailedAt",
    attemptsField: "departureReminderEmailAttempts"
  },
  { kind: "thankYou", label: "Poděkování po odjezdu", sentAtField: "thankYouEmailedAt", attemptsField: "thankYouEmailAttempts" }
]

const MAX_AUTOMATIC_ATTEMPTS = 3

// Shared between the reservations table and the calendar view — clicking a
// reservation in either place opens the same read-only detail.
export function ReservationDetailModal({
  reservation,
  onClose
}: {
  reservation: ReservationWithApartment
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-dark/60 px-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md rounded-[2px] bg-cream p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl">Detail rezervace</h2>
          <button type="button" onClick={onClose} className="cursor-pointer text-2xl leading-none text-mid hover:text-dark">
            ×
          </button>
        </div>
        <dl className="space-y-2 text-sm">
          <Row label="Apartmán" value={reservation.apartmentName} />
          <Row label="Termín" value={`${reservation.startDate} – ${reservation.endDate}`} />
          <Row label="Host" value={reservation.name || "-"} />
          <Row label="Email" value={reservation.email || "-"} />
          <Row label="Telefon" value={reservation.phone || "-"} />
          <Row label="Počet hostů" value={reservation.guests !== null ? String(reservation.guests) : "-"} />
          <Row label="Zdroj" value={SOURCE_LABELS[reservation.source] || reservation.source} />
          <Row label="Stav" value={describeReservationStatus(reservation.status)} />
          <Row label="Poznámka" value={reservation.note || "-"} />
          <Row label="Vytvořeno" value={new Date(reservation.createdAt).toLocaleString("cs-CZ")} />
          <Row label="Upraveno" value={new Date(reservation.updatedAt).toLocaleString("cs-CZ")} />
        </dl>

        {reservation.email && (
          <div className="mt-5 border-t border-light/60 pt-4">
            <p className="mb-3 text-xs uppercase tracking-wide text-mid">E-maily</p>
            {reservation.lastEmailError && (
              <p className="mb-3 text-sm text-accent">Poslední chyba: {reservation.lastEmailError}</p>
            )}
            <div className="space-y-2">
              {EMAIL_KINDS.map((item) => (
                <EmailResendRow
                  key={item.kind}
                  reservationId={reservation.id}
                  item={item}
                  sentAt={reservation[item.sentAtField] as string | null}
                  attempts={reservation[item.attemptsField] as number}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EmailResendRow({
  reservationId,
  item,
  sentAt,
  attempts
}: {
  reservationId: number
  item: { kind: EmailKind; label: string }
  sentAt: string | null
  attempts: number
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const statusText = sentAt
    ? `odesláno ${new Date(sentAt).toLocaleString("cs-CZ")}`
    : attempts > 0
      ? `zatím neodesláno (pokus ${Math.min(attempts, MAX_AUTOMATIC_ATTEMPTS)} z ${MAX_AUTOMATIC_ATTEMPTS})`
      : "zatím neodesláno"

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div>
        <p className="text-dark">{item.label}</p>
        <p className="text-xs text-mid">{statusText}</p>
        {state === "error" && errorMessage && <p className="text-xs text-accent">{errorMessage}</p>}
        {state === "sent" && <p className="text-xs text-dark">Odesláno.</p>}
      </div>
      <button
        type="button"
        disabled={state === "sending"}
        onClick={async () => {
          setState("sending")
          setErrorMessage(null)
          try {
            const response = await fetch(`/api/admin/reservations/${reservationId}/resend-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ kind: item.kind })
            })
            const payload = await response.json()
            if (!response.ok) {
              setState("error")
              setErrorMessage(payload.error || "E-mail se nepodařilo odeslat.")
              return
            }
            setState("sent")
          } catch {
            setState("error")
            setErrorMessage("E-mail se nepodařilo odeslat.")
          }
        }}
        className="shrink-0 cursor-pointer rounded-[2px] border border-mid/30 px-3 py-1.5 text-xs uppercase tracking-wide hover:bg-pale disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "sending" ? "Odesílám…" : "Odeslat znovu"}
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-light/60 pb-2">
      <dt className="text-mid">{label}</dt>
      <dd className="text-right text-dark">{value}</dd>
    </div>
  )
}
