import { prisma } from "../lib/db"

// Capacities and colours are the operational defaults the manager UI reads.
// maxAdults/maxChildren are an estimate from the floor area and layout —
// confirm them against what is actually advertised on Booking/Airbnb.
const APARTMENTS = [
  {
    slug: "studio-3",
    name: "Apartmán 1 - Studio ³",
    shortLabel: "S3",
    description: "Studio 1KK",
    areaM2: 41,
    maxAdults: 2,
    maxChildren: 1,
    cleaningMinutes: 60,
    color: "#333333",
    sortOrder: 1
  },
  {
    slug: "loft-10",
    name: "Apartmán 2 - Loft ¹⁰",
    shortLabel: "L10",
    description: "Apartmán 2KK loft",
    areaM2: 81,
    maxAdults: 4,
    maxChildren: 2,
    cleaningMinutes: 105,
    color: "#A07E4C",
    sortOrder: 2
  }
]

async function main() {
  const baseUrl = (process.env.PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")

  for (const apartment of APARTMENTS) {
    const { slug, ...attributes } = apartment

    await prisma.apartment.upsert({
      where: { slug },
      update: attributes,
      create: {
        slug,
        ...attributes,
        publicIcalUrl: `${baseUrl}/api/ical/${slug}`
      }
    })
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
