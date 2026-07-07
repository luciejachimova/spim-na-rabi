import nodemailer from "nodemailer"

export async function readJsonBody(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export function cleanValue(value) {
  return String(value || "").trim()
}

export function validateRequired(body, fields) {
  for (const field of fields) {
    if (!cleanValue(body?.[field])) {
      return `Pole ${field} je povinné.`
    }
  }

  if (body?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanValue(body.email))) {
    return "Zadejte platný email."
  }

  return null
}

export function mailErrorMessage(error, formName = "Zprávu") {
  if (error?.message === "SMTP_PASS is not configured") {
    return `${formName} se nepodařilo odeslat, protože na serveru chybí SMTP heslo.`
  }

  if (error?.code === "EAUTH" || error?.responseCode === 535) {
    return `${formName} se nepodařilo odeslat, protože Seznam odmítl přihlášení. Zkontrolujte SMTP heslo.`
  }

  if (["ETIMEDOUT", "ECONNECTION", "ESOCKET", "ECONNREFUSED"].includes(error?.code)) {
    return `${formName} se nepodařilo odeslat, protože se server nemohl spojit se Seznam Emailem. Zkuste to prosím později.`
  }

  return `${formName} se nyní nepodařilo odeslat. Zkuste to prosím později nebo nám napište přímo na spimnarabi@seznam.cz.`
}

export function logMailError(error) {
  console.error("SMTP delivery failed", {
    code: error?.code,
    command: error?.command,
    responseCode: error?.responseCode,
    message: error?.message,
  })
}

export async function sendMail({ subject, replyTo, text, html, to }) {
  const host = process.env.SMTP_HOST || process.env.SMTP_ADDRESS || "smtp.seznam.cz"
  const user = process.env.SMTP_USER || process.env.SMTP_USER_NAME || "spimnarabi@seznam.cz"
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD
  const port = Number(process.env.SMTP_PORT || 465)
  const secure = process.env.SMTP_SECURE === "true" || port === 465
  const recipient = to || process.env.CONTACT_INBOX || "spimnarabi@seznam.cz"
  const from = process.env.SMTP_FROM || "spimnarabi@seznam.cz"

  if (!pass) {
    throw new Error("SMTP_PASS is not configured")
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000
  })

  await transporter.sendMail({
    to: recipient,
    from: `"Spim na Rabí" <${from}>`,
    replyTo,
    subject,
    text,
    html
  })
}
