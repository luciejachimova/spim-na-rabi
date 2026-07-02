import { prisma } from "../lib/db"

const APARTMENTS = [
  { slug: "studio-3", name: "Apartmán 1 - Studio ³" },
  { slug: "loft-10", name: "Apartmán 2 - Loft ¹⁰" }
]

async function main() {
  const baseUrl = (process.env.PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")

  for (const apartment of APARTMENTS) {
    await prisma.apartment.upsert({
      where: { slug: apartment.slug },
      update: { name: apartment.name },
      create: {
        slug: apartment.slug,
        name: apartment.name,
        publicIcalUrl: `${baseUrl}/api/ical/${apartment.slug}`
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
