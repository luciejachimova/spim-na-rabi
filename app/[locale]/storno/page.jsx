import { getTranslations, setRequestLocale } from "next-intl/server"
import LegalContent from "@/components/LegalContent"
import { buildAlternates } from "@/lib/seo"

export async function generateMetadata({ params }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "meta" })

  return {
    title: t("cancellation.title"),
    description: t("cancellation.description"),
    alternates: buildAlternates(locale, "/storno")
  }
}

export default async function CancellationPage({ params }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("legal.cancellation")

  return (
    <LegalContent
      heroLabel={t("heroLabel")}
      title={t("title")}
      intro={t("intro")}
      sections={t.raw("sections")}
    />
  )
}
