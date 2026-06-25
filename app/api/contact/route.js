import { NextResponse } from "next/server"
import { cleanValue, readJsonBody, sendMail, validateRequired } from "@/lib/mail"

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
      subject: "Nová zpráva z formuláře Spím na Rabí",
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
    console.error(mailError)
    return NextResponse.json({ error: "Zprávu se nepodařilo odeslat. Zkontrolujte SMTP nastavení ve Vercelu." }, { status: 500 })
  }

  return NextResponse.json({ message: "Děkujeme, ozveme se vám." })
}
