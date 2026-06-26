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

export async function sendMail({ subject, replyTo, text }) {
  const host = process.env.SMTP_HOST || process.env.SMTP_ADDRESS
  const user = process.env.SMTP_USER || process.env.SMTP_USER_NAME
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD
  const port = Number(process.env.SMTP_PORT || 587)
  const secure = process.env.SMTP_SECURE === "true" || port === 465
  const to = process.env.CONTACT_INBOX || "spimnarabi@seznam.cz"
  const from = process.env.SMTP_FROM || user

  if (!host || !user || !pass || !from) {
    throw new Error("SMTP is not configured")
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  })

  await transporter.sendMail({
    to,
    from: `"Spim na Rabí" <${from}>`,
    replyTo,
    subject,
    text
  })
}
