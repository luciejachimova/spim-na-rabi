import { createTranslator } from "next-intl"
import { routing, type Locale } from "@/i18n/routing"

// Server-side message access that works OUTSIDE a request scope — used by the
// API routes (to translate error codes into the guest's language) and by the
// email builders (invoked from the cron scheduler, where there is no request
// locale to read). getTranslations() from next-intl/server can't be used there.

export function normalizeLocale(value: unknown): Locale {
  return routing.locales.includes(value as Locale) ? (value as Locale) : routing.defaultLocale
}

export async function loadMessages(locale: Locale) {
  return (await import(`../messages/${locale}.json`)).default
}

export async function getTranslator(locale: unknown, namespace?: string) {
  const safeLocale = normalizeLocale(locale)
  const messages = await loadMessages(safeLocale)
  return createTranslator({ locale: safeLocale, messages, namespace })
}
