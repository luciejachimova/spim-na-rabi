import path from "node:path"
import { PrismaClient } from "@prisma/client"

// SQLite `file:` URLs in DATABASE_URL are relative, but Prisma resolves
// relative paths inconsistently between the CLI and the generated client.
// Anchoring to process.cwd() here (and in prisma.config.ts) keeps both consistent.
function resolveDatabaseUrl() {
  const raw = process.env.DATABASE_URL || "file:./storage/development.sqlite3"
  const filePath = raw.replace(/^file:/, "")
  return path.isAbsolute(filePath) ? raw : `file:${path.resolve(/* turbopackIgnore: true */ process.cwd(), filePath)}`
}

function createPrismaClient() {
  const client = new PrismaClient({ datasourceUrl: resolveDatabaseUrl() })

  // PRAGMA statements that change a setting also return the new value as a
  // result row, which $executeRaw rejects on SQLite — use $queryRaw instead.
  client.$queryRawUnsafe("PRAGMA journal_mode = WAL;").catch((error) => console.error("Failed to set journal_mode", error))
  client.$queryRawUnsafe("PRAGMA busy_timeout = 5000;").catch((error) => console.error("Failed to set busy_timeout", error))

  return client
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
