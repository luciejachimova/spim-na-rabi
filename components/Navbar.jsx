"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"
import { navLinks } from "@/data/content"
import LanguageSwitcher from "./LanguageSwitcher"

export default function Navbar() {
  const t = useTranslations("nav")
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8)
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  return (
    <nav className={`fixed inset-x-0 top-0 z-50 border-b border-mid/10 bg-cream transition-shadow duration-300 ${scrolled ? "shadow-[0_2px_24px_rgba(51,51,51,0.07)]" : ""}`}>
      <div className="mx-auto flex h-[68px] max-w-[1100px] items-center justify-between px-8">
        <Link href="/" className="block shrink-0" aria-label="Spim na Rabí">
          <img src="/images/spim-na-rabi-logo.png" alt="Spim na Rabí" className="h-12 w-auto max-w-[150px] object-contain md:h-14 md:max-w-[180px]" />
        </Link>

        <ul className={`list-none items-center gap-8 md:flex ${open ? "fixed inset-x-0 top-[68px] z-40 flex h-[calc(100vh-68px)] flex-col justify-center gap-10 bg-cream" : "hidden"}`}>
          {navLinks.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`text-[0.78rem] font-medium uppercase tracking-[0.16em] transition-colors duration-200 hover:text-accent ${pathname === item.href ? "text-accent" : "text-dark"}`}
              >
                {t(item.key)}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/kontakt"
              className="rounded-[2px] bg-dark px-[1.4rem] py-2 text-[0.78rem] font-medium uppercase tracking-[0.16em] text-cream transition-colors duration-200 hover:bg-accent"
            >
              {t("reserve")}
            </Link>
          </li>
          <li className="md:hidden">
            <LanguageSwitcher className="text-[0.9rem]" />
          </li>
        </ul>

        <div className="flex items-center gap-4">
          <LanguageSwitcher className="hidden md:flex" />

          <button
            type="button"
            className="flex cursor-pointer flex-col gap-[5px] p-1 md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={t("openMenu")}
            aria-expanded={open}
          >
            <span className={`block h-[1.5px] w-[22px] bg-dark transition-all duration-300 ${open ? "translate-y-[6.5px] rotate-45" : ""}`} />
            <span className={`block h-[1.5px] w-[22px] bg-dark transition-all duration-300 ${open ? "opacity-0" : ""}`} />
            <span className={`block h-[1.5px] w-[22px] bg-dark transition-all duration-300 ${open ? "-translate-y-[6.5px] -rotate-45" : ""}`} />
          </button>
        </div>
      </div>
    </nav>
  )
}
