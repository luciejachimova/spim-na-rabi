import { prisma } from "../db"
import { importIcalFeed } from "../ical/import"
import { ReservationValidationError } from "./errors"
import { mapIcalFeed } from "./mappers"
import { getApartmentById } from "./queries"
import type { IcalFeedRecord, IcalFeedWithApartment, IcalImportResult, IcalProvider, SyncResult } from "./types"
import { validateIcalFeedUrl } from "./validation"

export async function upsertIcalFeed(input: {
  apartmentId: number
  provider: IcalProvider
  url: string
}): Promise<IcalFeedRecord> {
  const url = input.url.trim()
  if (!url) {
    throw new ReservationValidationError("URL feedu je povinná.")
  }

  validateIcalFeedUrl(input.provider, url)

  const apartment = await getApartmentById(input.apartmentId)
  if (!apartment) {
    throw new ReservationValidationError("Apartmán nebyl nalezen.")
  }

  const feed = await prisma.icalFeed.upsert({
    where: { apartmentId_provider: { apartmentId: input.apartmentId, provider: input.provider } },
    update: { url },
    create: { apartmentId: input.apartmentId, provider: input.provider, url }
  })

  return mapIcalFeed(feed)
}

// A single unreachable/broken feed shouldn't abort syncing the others —
// failures are recorded per feed (and surfaced via IcalFeed.lastSyncError).
// Shared by syncAllApartments (cron, all feeds) and syncApartment (admin
// "Synchronizovat nyní", one apartment's feeds only).
async function runFeedSync(feeds: IcalFeedWithApartment[]): Promise<IcalImportResult[]> {
  const results: IcalImportResult[] = []

  for (const feed of feeds) {
    try {
      results.push(await importIcalFeed(feed))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Neznámá chyba při synchronizaci."
      console.error("Failed to import ical feed", { feedId: feed.id, provider: feed.provider, error })
      results.push({
        apartmentId: feed.apartmentId,
        apartmentSlug: feed.apartment.slug,
        apartmentName: feed.apartment.name,
        provider: feed.provider as IcalProvider,
        fetchedEvents: 0,
        created: 0,
        updated: 0,
        deleted: 0,
        error: message
      })
    }
  }

  return results
}

export async function syncAllApartments(): Promise<SyncResult> {
  const feeds = await prisma.icalFeed.findMany({ include: { apartment: true } })
  return { feeds: await runFeedSync(feeds) }
}

export async function syncApartment(apartmentId: number): Promise<SyncResult> {
  const apartment = await getApartmentById(apartmentId)
  if (!apartment) {
    throw new ReservationValidationError("Apartmán nebyl nalezen.")
  }

  const feeds = await prisma.icalFeed.findMany({ where: { apartmentId }, include: { apartment: true } })
  return { feeds: await runFeedSync(feeds) }
}
