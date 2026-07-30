import { createTranslator } from "next-intl"
import { prisma } from "./db"
import { sendMail, logMailError } from "./mail"
import { EMAILABLE_STATUSES, getBaseUrl, toReservationWithApartment, type ReservationWithApartment } from "./reservations"
import { addDaysToKey, formatDateForPrague, getPragueHour, toUtcDate } from "./prague-date"
import { loadMessages, normalizeLocale } from "./i18n-messages"
import { getPathname } from "@/i18n/navigation"
import type { EmailTranslator } from "@/emails/components"
import { renderEmail } from "@/emails/render"
import { ReservationConfirmationEmail, reservationConfirmationSubject, reservationConfirmationText } from "@/emails/reservation-confirmation"
import { ArrivalInfoEmail, arrivalInfoSubject, arrivalInfoText } from "@/emails/arrival-info"
import { DepartureReminderEmail, departureReminderSubject, departureReminderText } from "@/emails/departure-reminder"
import { ThankYouEmail, thankYouSubject, thankYouText } from "@/emails/thank-you"

export type EmailKind = "confirmation" | "arrivalInfo" | "departureReminder" | "thankYou"
type ScheduledKind = Exclude<EmailKind, "confirmation">

const SCHEDULED_KINDS: ScheduledKind[] = ["arrivalInfo", "departureReminder", "thankYou"]

// A guest email gets up to 3 automatic attempts (this one plus two retries on
// later cron passes) before it's left for the admin resend button. An SMTP
// outage is usually brief — giving up after a single failure would mean a
// two-minute blip permanently costs the guest their confirmation email.
const MAX_ATTEMPTS = 3

// Attempts are spaced by the external cron's own ~15 minute cadence — this
// lock only needs to be wide enough to block genuinely overlapping/duplicate
// cron triggers (e.g. a retried webhook), not to enforce the retry spacing
// itself.
const RETRY_LOCK_MINUTES = 5

// Raw SQL column names, used only by claimAttempt's atomic UPDATE below —
// always looked up through these fixed tables (keyed by the closed EmailKind
// union), never built from request input.
const EMAILED_AT_COLUMN: Record<EmailKind, string> = {
  confirmation: "confirmation_emailed_at",
  arrivalInfo: "arrival_info_emailed_at",
  departureReminder: "departure_reminder_emailed_at",
  thankYou: "thank_you_emailed_at"
}
const ATTEMPTS_COLUMN: Record<EmailKind, string> = {
  confirmation: "confirmation_email_attempts",
  arrivalInfo: "arrival_info_email_attempts",
  departureReminder: "departure_reminder_email_attempts",
  thankYou: "thank_you_email_attempts"
}
const ATTEMPTED_AT_COLUMN: Record<EmailKind, string> = {
  confirmation: "confirmation_email_attempted_at",
  arrivalInfo: "arrival_info_email_attempted_at",
  departureReminder: "departure_reminder_email_attempted_at",
  thankYou: "thank_you_email_attempted_at"
}

interface ScheduleRule {
  dateField: "startDate" | "endDate"
  offsetDays: number
  hourGate: number
}

// Reservations store plain YYYY-MM-DD dates and the external cron runs every
// ~15 minutes with no exact guaranteed timing, so a send is windowed by date
// plus an hour gate for an "on time" send. The catch-up window absorbs a
// cron/SMTP outage of a few days without permanently losing a scheduled
// send — an already-late reservation sends immediately, ignoring the gate.
const SCHEDULE: Record<ScheduledKind, ScheduleRule> = {
  arrivalInfo: { dateField: "startDate", offsetDays: -1, hourGate: 15 },
  departureReminder: { dateField: "endDate", offsetDays: 0, hourGate: 9 },
  thankYou: { dateField: "endDate", offsetDays: 1, hourGate: 10 }
}

const CATCH_UP_WINDOW_DAYS = 3

// Booking flow edge case: the normal cron schedule targets "the day before
// check-in," so a reservation made the day before or on the day of check-in
// itself would otherwise wait for the next cron pass (and, before 15:00,
// possibly several hours) to get its arrival info — or in the worst case,
// arrive after check-in has already happened. Reservations store only a
// date (no check-in time), so this is a calendar-day check, not an exact
// 24-hour one: check-in today or tomorrow counts as imminent.
export function needsImmediateArrivalInfo(startDate: string): boolean {
  const todayKey = formatDateForPrague(new Date())
  const daysUntilCheckIn = Math.round((toUtcDate(startDate).getTime() - toUtcDate(todayKey).getTime()) / 86_400_000)
  return daysUntilCheckIn <= 1
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function computeNights(startDate: string, endDate: string) {
  return Math.round((toUtcDate(endDate).getTime() - toUtcDate(startDate).getTime()) / 86_400_000)
}

async function buildEmailContent(kind: EmailKind, reservation: ReservationWithApartment) {
  // Every guest email is rendered in the language the guest booked in
  // (reservation.locale). createTranslator works outside a request scope, so
  // it's safe here even though this runs from the cron scheduler.
  const locale = normalizeLocale(reservation.locale)
  const messages = await loadMessages(locale)
  const t = createTranslator({ locale, messages }) as unknown as EmailTranslator

  const path = getPathname({
    href: { pathname: "/reservation/[token]", params: { token: reservation.reservationToken ?? "" } },
    locale
  })
  const reservationUrl = `${getBaseUrl()}${path}`
  const name = reservation.name || t("email.guestFallback")
  const base = { t, locale }
  const summary = {
    apartmentName: reservation.apartmentName,
    startDate: reservation.startDate,
    endDate: reservation.endDate,
    nights: computeNights(reservation.startDate, reservation.endDate),
    guests: reservation.guests
  }

  if (kind === "confirmation") {
    const props = { ...base, name, reservationUrl, summary }
    return {
      subject: reservationConfirmationSubject(t),
      html: await renderEmail(<ReservationConfirmationEmail {...props} />),
      text: reservationConfirmationText(props)
    }
  }

  if (kind === "arrivalInfo") {
    const props = { ...base, name, apartmentSlug: reservation.apartmentSlug, reservationUrl, summary }
    return {
      subject: arrivalInfoSubject(t),
      html: await renderEmail(<ArrivalInfoEmail {...props} />),
      text: arrivalInfoText(props)
    }
  }

  if (kind === "departureReminder") {
    const props = { ...base, name, apartmentSlug: reservation.apartmentSlug, apartmentName: reservation.apartmentName }
    return {
      subject: departureReminderSubject(t),
      html: await renderEmail(<DepartureReminderEmail {...props} />),
      text: departureReminderText(props)
    }
  }

  const props = { ...base, name, apartmentSlug: reservation.apartmentSlug, source: reservation.source }
  return {
    subject: thankYouSubject(t),
    html: await renderEmail(<ThankYouEmail {...props} />),
    text: thankYouText(props)
  }
}

// Claims one attempt slot atomically: the UPDATE only succeeds if the email
// hasn't already been sent, the attempt budget isn't exhausted, and no other
// process claimed an attempt in the last few minutes. Because the increment,
// the "not already sent" check, and the recency check all happen in one
// UPDATE statement, two overlapping cron runs can never both claim the same
// attempt — SQLite/Turso serializes writes to the same row, so the second
// UPDATE always sees the first one's result before its own WHERE clause is
// evaluated. A failed send leaves the claim in place (attempts already
// incremented) rather than resetting it, so the next cron pass — 15 minutes
// later, well past the 5-minute lock — naturally becomes the next attempt.
// After MAX_ATTEMPTS, only the admin resend button (force: true, which
// bypasses this claim entirely) can send it.
async function claimAttempt(reservationId: number, kind: EmailKind): Promise<boolean> {
  const emailedAtColumn = EMAILED_AT_COLUMN[kind]
  const attemptsColumn = ATTEMPTS_COLUMN[kind]
  const attemptedAtColumn = ATTEMPTED_AT_COLUMN[kind]

  const rows = await prisma.$queryRawUnsafe<{ id: number }[]>(
    `UPDATE reservations
     SET ${attemptsColumn} = ${attemptsColumn} + 1, ${attemptedAtColumn} = CURRENT_TIMESTAMP
     WHERE id = ?
       AND ${emailedAtColumn} IS NULL
       AND ${attemptsColumn} < ?
       AND (${attemptedAtColumn} IS NULL OR ${attemptedAtColumn} < datetime('now', ?))
     RETURNING id`,
    reservationId,
    MAX_ATTEMPTS,
    `-${RETRY_LOCK_MINUTES} minutes`
  )
  return rows.length > 0
}

async function markEmailedAt(reservationId: number, kind: EmailKind) {
  const field =
    kind === "confirmation"
      ? "confirmationEmailedAt"
      : kind === "arrivalInfo"
        ? "arrivalInfoEmailedAt"
        : kind === "departureReminder"
          ? "departureReminderEmailedAt"
          : "thankYouEmailedAt"

  await prisma.reservation.update({
    where: { id: reservationId },
    data: { [field]: new Date(), lastEmailError: null }
  })
}

// Confirmation is first attempted synchronously at booking time (in
// app/api/reservation/route.ts). If that attempt fails, this picks it up on
// later cron passes for its remaining retries — it isn't date-windowed like
// the other three since it isn't tied to check-in/check-out.
async function findPendingConfirmationRetries(): Promise<ReservationWithApartment[]> {
  const candidates = await prisma.reservation.findMany({
    where: {
      status: { in: [...EMAILABLE_STATUSES] },
      email: { not: null },
      confirmationEmailedAt: null,
      confirmationEmailAttempts: { gt: 0, lt: MAX_ATTEMPTS }
    },
    include: { apartment: true }
  })

  return candidates.map((reservation) => toReservationWithApartment(reservation, reservation.apartment))
}

async function findDueReservations(kind: ScheduledKind): Promise<ReservationWithApartment[]> {
  const rule = SCHEDULE[kind]
  const now = new Date()
  const todayKey = formatDateForPrague(now)
  const onScheduleDateKey = addDaysToKey(todayKey, -rule.offsetDays)
  const earliestCatchUpDateKey = addDaysToKey(onScheduleDateKey, -(CATCH_UP_WINDOW_DAYS - 1))
  const dateRange = { gte: earliestCatchUpDateKey, lte: onScheduleDateKey }
  const baseWhere = { status: { in: [...EMAILABLE_STATUSES] }, email: { not: null } }

  const candidates = await prisma.reservation.findMany({
    where:
      kind === "arrivalInfo"
        ? { ...baseWhere, arrivalInfoEmailedAt: null, arrivalInfoEmailAttempts: { lt: MAX_ATTEMPTS }, startDate: dateRange }
        : kind === "departureReminder"
          ? {
              ...baseWhere,
              departureReminderEmailedAt: null,
              departureReminderEmailAttempts: { lt: MAX_ATTEMPTS },
              endDate: dateRange
            }
          : { ...baseWhere, thankYouEmailedAt: null, thankYouEmailAttempts: { lt: MAX_ATTEMPTS }, endDate: dateRange },
    include: { apartment: true }
  })

  const pragueHour = getPragueHour(now)
  const due = candidates.filter((reservation) => {
    const value = rule.dateField === "startDate" ? reservation.startDate : reservation.endDate
    return value < onScheduleDateKey || pragueHour >= rule.hourGate
  })

  return due.map((reservation) => toReservationWithApartment(reservation, reservation.apartment))
}

export interface SendLifecycleEmailResult {
  sent: boolean
  skipped?: "not-eligible" | "no-email"
  error?: string
}

// The one shared send path — used by the booking endpoint (confirmation),
// the cron scheduler (all four kinds, once due), and the admin resend button
// (any kind, force: true). SMTP failures never throw out of this function:
// they're logged and recorded on the reservation instead, so a failed guest
// email can never fail the booking itself or break the cron response the
// external scheduler depends on.
export async function sendLifecycleEmail(
  reservationId: number,
  kind: EmailKind,
  opts: { force?: boolean } = {}
): Promise<SendLifecycleEmailResult> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { apartment: true }
  })

  if (!reservation || !reservation.email) {
    return { sent: false, skipped: "no-email" }
  }

  if (!opts.force) {
    const claimed = await claimAttempt(reservationId, kind)
    if (!claimed) return { sent: false, skipped: "not-eligible" }
  }

  const reservationWithApartment = toReservationWithApartment(reservation, reservation.apartment)
  const { subject, html, text } = await buildEmailContent(kind, reservationWithApartment)

  try {
    await sendMail({ subject, replyTo: undefined, text, html, to: reservation.email })
    await markEmailedAt(reservationId, kind)
    return { sent: true }
  } catch (error) {
    logMailError(error)
    const message = describeError(error)
    await prisma.reservation.update({
      where: { id: reservationId },
      data: { lastEmailError: `${kind}: ${message}` }
    })
    return { sent: false, error: message }
  }
}

export interface ScheduledSendSummary {
  candidates: number
  attempted: number
  sent: number
  failed: number
}

// `candidates` is how many reservations matched the date/attempts window;
// `attempted` is how many actually got past claimAttempt's lock and had
// sendMail called. They differ when a candidate is still inside the
// 5-minute lock from a previous claim — expected and not an error.
async function processBatch(
  kind: EmailKind,
  reservations: ReservationWithApartment[],
  summary: ScheduledSendSummary
) {
  for (const reservation of reservations) {
    summary.candidates += 1
    try {
      const outcome = await sendLifecycleEmail(reservation.id, kind)
      if (outcome.sent) {
        summary.attempted += 1
        summary.sent += 1
      } else if (outcome.skipped !== "not-eligible") {
        summary.attempted += 1
        if (outcome.skipped !== "no-email") summary.failed += 1
      }
    } catch (error) {
      summary.attempted += 1
      console.error("Guest lifecycle email: unexpected failure", {
        kind,
        reservationId: reservation.id,
        error: describeError(error)
      })
      summary.failed += 1
    }
  }
}

// Never throws — a bug here must not break the iCal sync response the
// external cron (cron-job.org) uses as its success signal.
export async function runScheduledGuestEmailsSafely(): Promise<Record<EmailKind, ScheduledSendSummary>> {
  const results: Record<EmailKind, ScheduledSendSummary> = {
    confirmation: { candidates: 0, attempted: 0, sent: 0, failed: 0 },
    arrivalInfo: { candidates: 0, attempted: 0, sent: 0, failed: 0 },
    departureReminder: { candidates: 0, attempted: 0, sent: 0, failed: 0 },
    thankYou: { candidates: 0, attempted: 0, sent: 0, failed: 0 }
  }

  try {
    const pendingConfirmations = await findPendingConfirmationRetries()
    await processBatch("confirmation", pendingConfirmations, results.confirmation)
  } catch (error) {
    console.error("Guest lifecycle email: failed to query pending confirmation retries", { error: describeError(error) })
  }

  for (const kind of SCHEDULED_KINDS) {
    try {
      const due = await findDueReservations(kind)
      await processBatch(kind, due, results[kind])
    } catch (error) {
      console.error("Guest lifecycle email: failed to query due reservations", { kind, error: describeError(error) })
    }
  }

  return results
}
