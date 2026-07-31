import { PrismaClient } from "@prisma/client"
import { PrismaLibSQL } from "@prisma/adapter-libsql"
import type { Config } from "@libsql/client"
import { resolveDbTarget } from "./db-target"

function createPrismaClient() {
  // A plain file-based SQLite database has no persistent, shared disk on
  // serverless hosts (e.g. Vercel functions only get an ephemeral /tmp).
  // When TURSO_DATABASE_URL is set, connect to a remote libSQL (Turso)
  // database instead — same SQLite semantics, but a real persistent,
  // network-accessible database. Local dev keeps using a plain local file.
  //
  // resolveDbTarget() refuses a remote database outside production rather
  // than connecting to it silently — see lib/db-target.ts for why.
  const target = resolveDbTarget()
  const isRemote = target.kind === "remote-libsql"

  if (!isRemote) {
    // Not necessarily wrong (local dev and the Docker/VPS deployment both
    // intentionally rely on this fallback), but on a host without a
    // persistent local disk this is the exact misconfiguration that causes
    // "Failed to connect to database: .../storage/....sqlite3" — logged so
    // it's visible instead of only surfacing as a downstream connection error.
    console.warn("TURSO_DATABASE_URL is not set — falling back to a local SQLite file.", {
      resolvedUrl: target.url
    })
  }

  const config: Config = isRemote
    ? { url: target.url, authToken: process.env.TURSO_AUTH_TOKEN }
    : { url: target.url }

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
