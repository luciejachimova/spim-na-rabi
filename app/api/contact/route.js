import { NextResponse } from "next/server"
import { cleanValue, logMailError, readJsonBody, sendMail, validateRequired } from "@/lib/mail"
import { getTranslator, normalizeLocale } from "@/lib/i18n-messages"

export const runtime = "nodejs"

export async function POST(request) {
  const body = await readJsonBody(request)

  const locale = normalizeLocale(body?.locale)
  const t = await getTranslator(locale, "errors")

  if (!body) {
    return NextResponse.json({ error: t("invalidForm") }, { status: 400 })
  }

  const errorCode = validateRequired(body, ["name", "email", "body"])

  if (errorCode) {
    return NextResponse.json({ error: t(errorCode) }, { status: 422 })
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
        `Jazyk: ${locale}`,
        "",
        "Zpráva:",
        message
      ].join("\n")
    })
  } catch (mailError) {
    logMailError(mailError)
    return NextResponse.json({ error: t("mailFailed") }, { status: 500 })
  }

  const successT = await getTranslator(locale, "contactApi")
  return NextResponse.json({ message: successT("success") })
}
