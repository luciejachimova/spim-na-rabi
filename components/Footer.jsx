"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { apartments, legalLinks, navLinks } from "@/data/content"

const footerLinkClass = "text-sm text-mid transition-colors duration-200 hover:text-dark"

export default function Footer() {
  const t = useTranslations()
  const nav = useTranslations("nav")
  const legal = useTranslations("meta")

  return (
    <footer className="border-t border-mid/15 bg-cream pb-10 pt-16">
      <div className="mx-auto max-w-[1100px] px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <span className="mb-2 block font-script text-[1.4rem] text-dark">Spim na Rabí</span>
            <p className="max-w-[220px] text-sm leading-relaxed text-mid">{t("footer.tagline")}</p>
            <div className="mt-5 flex gap-3">
              <a href="https://www.facebook.com/profile.php?id=61579506120985" title="Facebook" target="_blank" rel="noopener" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-light text-mid transition-colors duration-200 hover:border-dark hover:text-dark">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M13.36 22v-8.2h2.76l.41-3.2h-3.17V8.56c0-.93.26-1.56 1.59-1.56H16.8V4.14c-.32-.04-1.43-.14-2.72-.14-2.69 0-4.53 1.64-4.53 4.66v1.94H6.5v3.2h3.05V22h3.81Z" /></svg>
              </a>
              <a href="https://www.instagram.com/spimnarabi/" title="Instagram" target="_blank" rel="noopener" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-light text-mid transition-colors duration-200 hover:border-dark hover:text-dark">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Zm5.25-2.38a1.13 1.13 0 1 1 0 2.26 1.13 1.13 0 0 1 0-2.26Z" /></svg>
              </a>
            </div>
          </div>

          <div className="hidden md:block">
            <h4 className="mb-4 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-dark">{t("footer.pagesHeading")}</h4>
            <ul className="list-none space-y-2">
              {navLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={footerLinkClass}>{nav(item.key)}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-dark">{t("footer.stayHeading")}</h4>
            <ul className="list-none space-y-2">
              {apartments.map((apartment) => (
                <li key={apartment.slug}>
                  <Link href="/cenik" className={footerLinkClass}>{apartment.name}</Link>
                </li>
              ))}
            </ul>
            <h4 className="mb-4 mt-8 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-dark">{t("footer.legalHeading")}</h4>
            <ul className="list-none space-y-2">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={footerLinkClass}>{legal(`${item.key}.title`)}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-dark">{t("footer.contactHeading")}</h4>
            <ul className="list-none space-y-2">
              <li><a href="mailto:spimnarabi@seznam.cz" className={footerLinkClass}>spimnarabi@seznam.cz</a></li>
              <li><a href="tel:+420723936426" className={footerLinkClass}>+420 723 936 426</a></li>
              <li><span className="text-sm text-mid">Rabí 175, 342 01</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-mid/10 pt-6 text-center text-[0.75rem] tracking-wide text-light">
          © {new Date().getFullYear()} {t("footer.copyright")}
        </div>
      </div>
    </footer>
  )
}
