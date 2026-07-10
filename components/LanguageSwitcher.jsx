"use client"

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"

const LABELS = { cs: "CZ", de: "DE", en: "EN" }

// Switches locale while staying on the current page. usePathname() returns the
// internal (canonical) pathname, so router.replace re-resolves it to the target
// locale's localized URL — no full reload, same page.
export default function LanguageSwitcher({ className = "" }) {
  const activeLocale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className={`flex items-center gap-1 text-[0.72rem] font-medium uppercase tracking-[0.12em] ${className}`} role="group" aria-label="Language">
      {routing.locales.map((locale, index) => {
        const isActive = locale === activeLocale
        return (
          <span key={locale} className="flex items-center">
            {index > 0 && <span aria-hidden="true" className="px-1 text-light">|</span>}
            <button
              type="button"
              lang={locale}
              aria-current={isActive ? "true" : undefined}
              onClick={() => {
                if (!isActive) router.replace(pathname, { locale })
              }}
              className={`cursor-pointer px-1 transition-colors duration-200 hover:text-accent ${isActive ? "text-accent" : "text-mid"}`}
            >
              {LABELS[locale]}
            </button>
          </span>
        )
      })}
    </div>
  )
}
