import { NextResponse } from "next/server"
import { cleanValue, logMailError, mailErrorMessage, readJsonBody, sendMail, validateRequired } from "@/lib/mail"

export const runtime = "nodejs"

export async function POST(request) {
  const body = await readJsonBody(request)

  if (!body) {
    return NextResponse.json({ error: "Neplatná data formuláře." }, { status: 400 })
  }

  const error = validateRequired(body, ["name", "email", "body"])

  if (error) {
    return NextResponse.json({ error }, { status: 422 })
  }

  const name = cleanValue(body.name)
  const email = cleanValue(body.email)
  const phone = cleanValue(body.phone)
  const message = cleanValue(body.body)

  try {
    await sendMail({
      subject: "Nová zpráva z formuláře Spim na Rabí",
      replyTo: email,
      text: [
        `Jméno: ${name}`,
        `Email: ${email}`,
        `Telefon: ${phone || "-"}`,
        "",
        "Zpráva:",
        message
      ].join("\n")
    })
  } catch (mailError) {
    logMailError(mailError)
    return NextResponse.json({ error: mailErrorMessage(mailError, "Zprávu") }, { status: 500 })
  }

  return NextResponse.json({ message: "Děkujeme, ozveme se vám." })
}
