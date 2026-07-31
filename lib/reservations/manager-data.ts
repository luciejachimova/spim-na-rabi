import { prisma } from "../db"

// The manager form needs more of an apartment than ApartmentRecord exposes
// (capacity, check-in times, pet rule), but not the whole model — and what it
// does need has to be serialisable across the server/client boundary.
// Declared here, next to the query that produces it: lib must not import from
// components, or the dependency runs backwards.
export interface ApartmentOption {
  id: number
  name: string
  shortLabel: string | null
  maxAdults: number
  maxChildren: number
  petsAllowed: boolean
  checkInFrom: string
  checkOutUntil: string
}

export async function listApartmentOptions(): Promise<ApartmentOption[]> {
  const apartments = await prisma.apartment.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      shortLabel: true,
      maxAdults: true,
      maxChildren: true,
      petsAllowed: true,
      checkInFrom: true,
      checkOutUntil: true
    }
  })

  return apartments
}

export interface ApartmentFilterOption {
  id: number
  name: string
  shortLabel: string | null
  color: string
}

export async function listApartmentFilters(): Promise<ApartmentFilterOption[]> {
  return prisma.apartment.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, shortLabel: true, color: true }
  })
}
