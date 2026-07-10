import { getTranslations, setRequestLocale } from "next-intl/server"
import LegalContent from "@/components/LegalContent"
import { buildAlternates } from "@/lib/seo"

export async function generateMetadata({ params }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "meta" })

  return {
    title: t("terms.title"),
    description: t("terms.description"),
    alternates: buildAlternates(locale, "/podminky")
  }
}

export default async function TermsPage({ params }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("legal.terms")

  return (
    <LegalContent
      heroLabel={t("heroLabel")}
      title={t("title")}
      intro={t("intro")}
      sections={t.raw("sections")}
    />
  )
}
