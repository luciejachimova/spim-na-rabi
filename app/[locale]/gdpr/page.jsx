import { getTranslations, setRequestLocale } from "next-intl/server"
import LegalContent from "@/components/LegalContent"
import { buildAlternates } from "@/lib/seo"

export async function generateMetadata({ params }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "meta" })

  return {
    title: t("gdpr.title"),
    description: t("gdpr.description"),
    alternates: buildAlternates(locale, "/gdpr")
  }
}

export default async function GdprPage({ params }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("legal.gdpr")

  return (
    <LegalContent
      heroLabel={t("heroLabel")}
      title={t("title")}
      intro={t("intro")}
      sections={t.raw("sections")}
    />
  )
}
