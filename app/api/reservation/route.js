import { NextResponse } from "next/server"
import { cleanValue, logMailError, mailErrorMessage, readJsonBody, sendMail, validateRequired } from "@/lib/mail"

export const runtime = "nodejs"

export async function POST(request) {
  const body = await readJsonBody(request)

  if (!body) {
    return NextResponse.json({ error: "Neplatná data formuláře." }, { status: 400 })
  }

  const error = validateRequired(body, ["name", "email", "dateFrom", "dateTo", "guests"])

  if (error) {
    return NextResponse.json({ error }, { status: 422 })
  }

  const name = cleanValue(body.name)
  const email = cleanValue(body.email)
  const phone = cleanValue(body.phone)
  const apartment = cleanValue(body.apartment)
  const dateFrom = cleanValue(body.dateFrom)
  const dateTo = cleanValue(body.dateTo)
  const guests = cleanValue(body.guests)
  const note = cleanValue(body.note)

  try {
    await sendMail({
      subject: "Nová rezervace Spim na Rabí",
      replyTo: email,
      text: [
        `Jméno: ${name}`,
        `Email: ${email}`,
        `Telefon: ${phone || "-"}`,
        `Apartmán: ${apartment || "-"}`,
        `Příjezd: ${dateFrom}`,
        `Odjezd: ${dateTo}`,
        `Počet hostů: ${guests}`,
        "",
        "Poznámka:",
        note || "-"
      ].join("\n")
    })
  } catch (mailError) {
    logMailError(mailError)
    return NextResponse.json({ error: mailErrorMessage(mailError, "Rezervaci") }, { status: 500 })
  }

  return NextResponse.json({ message: "Děkujeme, ozveme se vám s potvrzením rezervace." })
}
