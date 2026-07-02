// Uses Web Crypto (crypto.subtle) rather than node:crypto so this also works
// unmodified if middleware.ts ever needs to run on the Edge runtime.

export const ADMIN_SESSION_COOKIE = "admin_session"

const SESSION_TTL_MS = 12 * 60 * 60 * 1000
export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured")
  }
  return secret
}

function base64UrlEncode(bytes: ArrayBuffer | Uint8Array) {
  const buffer = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ""
  for (const byte of buffer) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=")
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify"
  ])
}

export async function createSessionCookieValue(): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ exp: expiresAt })))
  const key = await importHmacKey(getSecret())
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))

  return `${payload}.${base64UrlEncode(signature)}`
}

export async function verifySessionCookieValue(value: string | undefined | null): Promise<boolean> {
  if (!value) {
    return false
  }

  const [payload, signature] = value.split(".")
  if (!payload || !signature) {
    return false
  }

  try {
    const key = await importHmacKey(getSecret())
    const valid = await crypto.subtle.verify("HMAC", key, base64UrlDecode(signature).buffer as ArrayBuffer, new TextEncoder().encode(payload))

    if (!valid) {
      return false
    }

    const { exp } = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload))) as { exp: number }
    return typeof exp === "number" && exp > Date.now()
  } catch {
    return false
  }
}
