import { PageHero } from "@/components/ui"

// Shared layout for the legal/info pages (GDPR, terms, cancellation). Content
// is passed in already translated so this stays a plain presentational
// (server-renderable) component.
export default function LegalContent({ heroLabel, title, intro, sections }) {
  return (
    <>
      <PageHero label={heroLabel} title={title} />

      <section className="py-24 md:py-[100px]">
        <div className="mx-auto max-w-[720px] px-8 js-fade-in">
          <p className="mb-12 text-[0.95rem] leading-[1.8] text-mid">{intro}</p>

          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.heading}>
                <h2 className="mb-3 font-serif text-[1.4rem] font-normal leading-snug text-dark">{section.heading}</h2>
                <p className="text-[0.95rem] leading-[1.8] text-mid">{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
