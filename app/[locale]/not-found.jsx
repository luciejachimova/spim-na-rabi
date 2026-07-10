"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { PageHero } from "@/components/ui"

export default function NotFound() {
  const t = useTranslations("notFound")

  return (
    <>
      <PageHero label="404" title={t("title")} />
      <section className="py-24 md:py-[100px]">
        <div className="mx-auto max-w-[560px] px-8 text-center js-fade-in">
          <p className="mb-8 text-[0.95rem] leading-relaxed text-mid">{t("body")}</p>
          <Link
            href="/"
            className="inline-block cursor-pointer rounded-[2px] border-none bg-dark px-10 py-[0.9rem] text-[0.78rem] font-medium uppercase tracking-[0.18em] text-cream transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent"
          >
            {t("cta")}
          </Link>
        </div>
      </section>
    </>
  )
}
