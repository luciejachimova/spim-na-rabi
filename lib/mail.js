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

// Returns a key into the "errors" message namespace (or null when valid), so
// API routes can translate the failure into the request's language.
export function validateRequired(body, fields) {
  for (const field of fields) {
    if (!cleanValue(body?.[field])) {
      return "requiredField"
    }
  }

  if (body?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanValue(body.email))) {
    return "emailInvalid"
  }

  return null
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
