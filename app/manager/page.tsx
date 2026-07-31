import type { Metadata } from "next"
import Link from "next/link"
import { TodayCard } from "@/components/manager/today-card"
import { formatDate, formatWeekdayLong } from "@/lib/format"
import { getTodayOverview } from "@/lib/reservations/today"

export const metadata: Metadata = { title: "Dnes | Spim Manager" }

// The manifest's start_url, so this is what an installed app opens to. It has
// to answer "what is happening today, what is coming, is anything wrong"
// without scrolling or tapping.
export const dynamic = "force-dynamic"

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs uppercase tracking-[0.14em] text-muted">
        {title}
        {count !== undefined && count > 0 && <span className="ml-1.5 text-dark">{count}</span>}
      </h2>
      {children}
    </section>
  )
}

export default async function TodayPage() {
  const overview = await getTodayOverview()
  const nothingToday =
    overview.arrivalsToday.length === 0 && overview.departuresToday.length === 0 && overview.stayingNow.length === 0

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl">Dnes</h1>
        <p className="text-muted">
          {formatWeekdayLong(overview.today)} {formatDate(overview.today)}
        </p>
      </div>

      {/* Problems first — the point of opening the app is partly to find out
          there isn't one. An empty space here is itself the answer. */}
      {overview.problems.length > 0 && (
        <ul className="space-y-2" aria-label="Vyžaduje pozornost">
          {overview.problems.map((problem, index) => (
            <li key={`${problem.kind}-${index}`}>
              <Link
                href={problem.href ?? "/manager/rezervace"}
                className="block rounded-[2px] border border-alert/50 bg-alert/10 px-3 py-2.5 text-sm transition-colors hover:border-alert"
              >
                {problem.text}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {nothingToday && (
        <p className="rounded-[2px] border border-dark/10 bg-white px-3 py-4 text-center text-muted">
          Dnes žádný příjezd ani odjezd.
        </p>
      )}

      {overview.arrivalsToday.length > 0 && (
        <Section title="Přijíždí dnes" count={overview.arrivalsToday.length}>
          <div className="space-y-2">
            {overview.arrivalsToday.map((stay) => (
              <TodayCard key={stay.id} stay={stay} variant="arrival" />
            ))}
          </div>
        </Section>
      )}

      {overview.departuresToday.length > 0 && (
        <Section title="Odjíždí dnes" count={overview.departuresToday.length}>
          <div className="space-y-2">
            {overview.departuresToday.map((stay) => (
              <TodayCard key={stay.id} stay={stay} variant="departure" />
            ))}
          </div>
          {/* The cleaning module lands in the next phase; until then the
              departure itself is the reminder, so say so rather than leaving
              a gap where a task list will be. */}
          <p className="text-xs text-muted">Úklidy zatím řešte mimo aplikaci — modul přijde v další fázi.</p>
        </Section>
      )}

      {overview.stayingNow.length > 0 && (
        <Section title="Ubytovaní" count={overview.stayingNow.length}>
          <div className="space-y-2">
            {overview.stayingNow.map((stay) => (
              <TodayCard key={stay.id} stay={stay} variant="staying" />
            ))}
          </div>
        </Section>
      )}

      {overview.freeApartments.length > 0 && (
        <p className="text-sm text-muted">
          Volno: {overview.freeApartments.map((apartment) => apartment.shortLabel || apartment.name).join(", ")}
        </p>
      )}

      <Section title="Zítra">
        {overview.arrivalsTomorrow.length === 0 && overview.departuresTomorrow.length === 0 ? (
          <p className="text-sm text-muted">Nic v plánu.</p>
        ) : (
          <div className="space-y-2">
            {overview.arrivalsTomorrow.map((stay) => (
              <TodayCard key={`in-${stay.id}`} stay={stay} variant="arrival" />
            ))}
            {overview.departuresTomorrow.map((stay) => (
              <TodayCard key={`out-${stay.id}`} stay={stay} variant="departure" />
            ))}
          </div>
        )}
      </Section>

      <div className="flex gap-2">
        <Link
          href="/manager/rezervace/nova"
          className="flex-1 cursor-pointer rounded-[2px] bg-dark px-4 py-3 text-center text-sm uppercase tracking-wide text-sand transition-colors hover:bg-alert"
        >
          Nová rezervace
        </Link>
        <Link
          href="/manager/rezervace"
          className="flex-1 cursor-pointer rounded-[2px] border border-dark/20 px-4 py-3 text-center text-sm uppercase tracking-wide text-muted transition-colors hover:border-dark hover:text-dark"
        >
          Všechny rezervace
        </Link>
      </div>
    </div>
  )
}
