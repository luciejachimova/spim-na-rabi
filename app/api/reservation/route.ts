import { NextResponse } from "next/server"
import { cleanValue, logMailError, mailErrorMessage, readJsonBody, sendMail, validateRequired } from "@/lib/mail"
import { createWebsiteReservation, ReservationConflictError, ReservationValidationError } from "@/lib/reservations"
import { sendLifecycleEmail } from "@/lib/guest-emails"

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
}

function readString(value: unknown) {
  return cleanValue(value)
}

export async function POST(request: Request) {
  const body = (await readJsonBody(request)) as ReservationRequestBody | null

  if (!body) {
    return NextResponse.json({ error: "Neplatná data formuláře." }, { status: 400 })
  }

  const normalizedInput = {
    name: body.name,
    email: body.email,
    dateFrom: body.dateFrom ?? body.date_from,
    dateTo: body.dateTo ?? body.date_to,
    guests: body.guests
  }

  const error = validateRequired(normalizedInput, ["name", "email", "dateFrom", "dateTo", "guests"])
  if (error) {
    return NextResponse.json({ error }, { status: 422 })
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
      note
    })

    reservation = result.reservation

    try {
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
  } catch (error) {
    if (error instanceof ReservationValidationError || error instanceof ReservationConflictError) {
      return NextResponse.json({ error: error.message }, { status: error instanceof ReservationConflictError ? 409 : 422 })
    }

    console.error("Failed to save reservation", error)
    return NextResponse.json({ error: "Rezervaci se nepodařilo uložit." }, { status: 500 })
  }

  return NextResponse.json({
    message: "Děkujeme, ozveme se vám s potvrzením rezervace.",
    reservationToken: reservation.reservationToken
  })
}
