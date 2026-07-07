import type { HousekeepingSchedule, ReservationWithApartment } from "@/lib/reservations"

function HousekeepingList({ title, reservations }: { title: string; reservations: ReservationWithApartment[] }) {
  return (
    <div className="rounded-[2px] border border-mid/20 bg-pale p-4">
      <p className="text-xs uppercase tracking-wide text-mid">
        {title} <span className="text-mid/70">({reservations.length})</span>
      </p>
      {reservations.length === 0 ? (
        <p className="mt-2 text-sm text-mid">Žádné</p>
      ) : (
        <ul className="mt-2 space-y-1.5 text-sm">
          {reservations.map((reservation) => (
            <li key={reservation.id} className="flex justify-between gap-2">
              <span className="text-dark">{reservation.apartmentName}</span>
              <span className="text-mid">{reservation.name || "-"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function AdminHousekeeping({ schedule }: { schedule: HousekeepingSchedule }) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-medium">Dnešní a zítřejší pohyb</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HousekeepingList title="Dnešní příjezdy" reservations={schedule.todayCheckIns} />
        <HousekeepingList title="Dnešní odjezdy" reservations={schedule.todayCheckOuts} />
        <HousekeepingList title="Zítřejší příjezdy" reservations={schedule.tomorrowCheckIns} />
        <HousekeepingList title="Zítřejší odjezdy" reservations={schedule.tomorrowCheckOuts} />
      </div>
    </section>
  )
}
