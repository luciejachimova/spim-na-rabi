import path from "node:path"
import { PrismaClient } from "@prisma/client"
import { PrismaLibSQL } from "@prisma/adapter-libsql"
import type { Config } from "@libsql/client"

// SQLite `file:` URLs in DATABASE_URL are relative, but Prisma resolves
// relative paths inconsistently between the CLI and the generated client.
// Anchoring to process.cwd() here (and in prisma.config.ts) keeps both consistent.
function resolveLocalFileUrl() {
  const raw = process.env.DATABASE_URL || "file:./storage/development.sqlite3"
  const filePath = raw.replace(/^file:/, "")
  return path.isAbsolute(filePath) ? raw : `file:${path.resolve(/* turbopackIgnore: true */ process.cwd(), filePath)}`
}

function createPrismaClient() {
  // A plain file-based SQLite database has no persistent, shared disk on
  // serverless hosts (e.g. Vercel functions only get an ephemeral /tmp).
  // When TURSO_DATABASE_URL is set, connect to a remote libSQL (Turso)
  // database instead — same SQLite semantics, but a real persistent,
  // network-accessible database. Local dev keeps using a plain local file.
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const isRemote = Boolean(tursoUrl)

  if (!isRemote) {
    // Not necessarily wrong (local dev and the Docker/VPS deployment both
    // intentionally rely on this fallback), but on a host without a
    // persistent local disk this is the exact misconfiguration that causes
    // "Failed to connect to database: .../storage/....sqlite3" — logged so
    // it's visible instead of only surfacing as a downstream connection error.
    console.warn("TURSO_DATABASE_URL is not set — falling back to a local SQLite file.", {
      resolvedUrl: resolveLocalFileUrl()
    })
  }

  const config: Config = tursoUrl
    ? { url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN }
    : { url: resolveLocalFileUrl() }

  const adapter = new PrismaLibSQL(config)
  const client = new PrismaClient({ adapter })

  // PRAGMA statements only apply to a local SQLite file connection — Turso's
  // remote protocol rejects them outright ("SQL not allowed statement").
  // Concurrency there is handled server-side, so there's nothing to configure.
  if (!isRemote) {
    // PRAGMA statements that change a setting also return the new value as a
    // result row, which $executeRaw rejects on SQLite — use $queryRaw instead.
    client.$queryRawUnsafe("PRAGMA journal_mode = WAL;").catch((error) => console.error("Failed to set journal_mode", error))
    client.$queryRawUnsafe("PRAGMA busy_timeout = 5000;").catch((error) => console.error("Failed to set busy_timeout", error))
  }

  return client
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
