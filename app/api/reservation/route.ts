import { NextResponse } from "next/server"
import { cleanValue, logMailError, readJsonBody, sendMail, validateRequired } from "@/lib/mail"
import { createWebsiteReservation, ReservationConflictError, ReservationValidationError } from "@/lib/reservations"
import { needsImmediateArrivalInfo, sendLifecycleEmail } from "@/lib/guest-emails"
import { getTranslator, normalizeLocale } from "@/lib/i18n-messages"

export const runtime = "nodejs"

interface ReservationRequestBody {
  name?: unknown
  email?: unknown
  phone?: unknown
  apartment_selection?: unknown
  apartmentSelection?: unknown
  dateFrom?: unknown
  date_from?: unknown
  dateTo?: unknown
  date_to?: unknown
  guests?: unknown
  note?: unknown
  locale?: unknown
}

function readString(value: unknown) {
  return cleanValue(value)
}

export async function POST(request: Request) {
  const body = (await readJsonBody(request)) as ReservationRequestBody | null

  const locale = normalizeLocale(body?.locale)
  const t = await getTranslator(locale, "errors")

  if (!body) {
    return NextResponse.json({ error: t("invalidForm") }, { status: 400 })
  }

  const normalizedInput = {
    name: body.name,
    email: body.email,
    dateFrom: body.dateFrom ?? body.date_from,
    dateTo: body.dateTo ?? body.date_to,
    guests: body.guests
  }

  const errorCode = validateRequired(normalizedInput, ["name", "email", "dateFrom", "dateTo", "guests"])
  if (errorCode) {
    return NextResponse.json({ error: t(errorCode) }, { status: 422 })
  }

  const name = readString(body.name)
  const email = readString(body.email)
  const phone = readString(body.phone)
  const apartmentSelection = readString(body.apartmentSelection ?? body.apartment_selection)
  const dateFrom = readString(body.dateFrom ?? body.date_from)
  const dateTo = readString(body.dateTo ?? body.date_to)
  const guests = Number(readString(body.guests))
  const note = readString(body.note)

  let reservation
  try {
    const result = await createWebsiteReservation({
      name,
      email,
      phone,
      apartmentSelection,
      startDate: dateFrom,
      endDate: dateTo,
      guests,
      note,
      locale
    })

    reservation = result.reservation

    try {
      // Owner notification stays in Czech; the guest's chosen language is
      // included so the admin knows which language to reply in.
      await sendMail({
        subject: "Nová rezervace Spim na Rabí",
        replyTo: email,
        text: [
          `Jméno: ${name}`,
          `Email: ${email}`,
          `Telefon: ${phone || "-"}`,
          `Apartmán: ${result.apartment.name}`,
          `Příjezd: ${dateFrom}`,
          `Odjezd: ${dateTo}`,
          `Počet hostů: ${guests}`,
          `Jazyk hosta: ${locale}`,
          "",
          "Poznámka:",
          note || "-",
          "",
          `Zdroj: ${reservation.source}`,
          `Status: ${reservation.status}`
        ].join("\n")
      })
    } catch (mailError) {
      logMailError(mailError)
    }

    try {
      await sendLifecycleEmail(reservation.id, "confirmation")
    } catch (guestMailError) {
      // Never let a guest-email failure fail the reservation itself —
      // sendLifecycleEmail already logs and records the error on the row.
      console.error("Failed to send guest confirmation email", guestMailError)
    }

    // Check-in tomorrow or sooner: don't wait for the day-before cron pass,
    // send arrival info now. Goes through the same sendLifecycleEmail/
    // claimAttempt path as the cron does, so it's still protected by the
    // same atomic "never sent twice" claim and the same retry budget — if
    // this attempt fails, the next cron pass picks up the remaining retries
    // exactly as it would for any other failed scheduled send.
    if (needsImmediateArrivalInfo(reservation.startDate)) {
      try {
        await sendLifecycleEmail(reservation.id, "arrivalInfo")
      } catch (arrivalMailError) {
        console.error("Failed to send immediate arrival-info email", arrivalMailError)
      }
    }
  } catch (error) {
    if (error instanceof ReservationValidationError || error instanceof ReservationConflictError) {
      const message = error.code ? t(error.code) : error.message
      return NextResponse.json({ error: message }, { status: error instanceof ReservationConflictError ? 409 : 422 })
    }

    console.error("Failed to save reservation", error)
    return NextResponse.json({ error: t("saveFailed") }, { status: 500 })
  }

  const successT = await getTranslator(locale, "reservationApi")
  return NextResponse.json({
    message: successT("success"),
    reservationToken: reservation.reservationToken
  })
}
