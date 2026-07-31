import path from "node:path"

// Single place that decides which database this process is allowed to talk to.
//
// The rule exists because of a real near-miss: with TURSO_DATABASE_URL filled
// in inside a local `.env`, running `npx tsx prisma/seed.ts` on a laptop
// connected to the *production* database and started upserting apartments.
// Nothing was lost only because the schema happened to differ. Local tooling
// must never be one forgotten variable away from writing to production.
//
// Remote access is therefore opt-in, not the default:
//   • on Vercel (VERCEL is set by the platform in every environment) — allowed,
//     this is how production is meant to run;
//   • anywhere else, only with DB_ALLOW_REMOTE=1 stated explicitly, which is
//     what a self-hosted deploy sets, and what a deliberate one-off command
//     against production passes inline.
// Otherwise a remote URL is refused loudly instead of being used silently.

export const DB_ALLOW_REMOTE_FLAG = "DB_ALLOW_REMOTE"

export interface DbTarget {
  kind: "local-file" | "remote-libsql"
  url: string
  /** Safe to log: a remote URL keeps its host but never its auth token. */
  describe: string
}

function isRemoteUrl(url: string) {
  return /^(libsql|wss?|https?):\/\//i.test(url)
}

function describeRemote(url: string) {
  try {
    return new URL(url).host
  } catch {
    return "neznámý host"
  }
}

const DEFAULT_LOCAL_URL = "file:./storage/development.sqlite3"

function rawDatabaseUrl() {
  return process.env.DATABASE_URL || DEFAULT_LOCAL_URL
}

export function resolveLocalFileUrl(databaseUrl = process.env.DATABASE_URL) {
  const raw = databaseUrl || DEFAULT_LOCAL_URL
  const filePath = raw.replace(/^file:/, "")
  return path.isAbsolute(filePath) ? raw : `file:${path.resolve(process.cwd(), filePath)}`
}

export function isRemoteAllowed() {
  return Boolean(process.env.VERCEL) || process.env[DB_ALLOW_REMOTE_FLAG] === "1"
}

export class ProductionDatabaseBlockedError extends Error {}

function blocked(host: string, source: string): never {
  throw new ProductionDatabaseBlockedError(
    [
      "",
      "  ╭──────────────────────────────────────────────────────────────────╮",
      "  │  ZASTAVENO: pokus o připojení ke vzdálené databázi z lokálního   │",
      "  │  prostředí.                                                     │",
      "  ╰──────────────────────────────────────────────────────────────────╯",
      "",
      `  Zdroj adresy: ${source}`,
      `  Cílový host:  ${host}`,
      "",
      "  Lokální vývoj musí běžet nad lokálním SQLite souborem nebo nad",
      "  samostatnou vývojovou databází — ne nad produkcí. Migrace ani seed",
      "  se proti produkci z laptopu spouštět nemají.",
      "",
      "  Co udělat:",
      "   • pro běžný vývoj zakomentujte TURSO_DATABASE_URL a TURSO_AUTH_TOKEN",
      "     v .env (aplikace pak použije storage/development.sqlite3),",
      "   • pro vývojovou Turso databázi nastavte její adresu a přidejte",
      `     ${DB_ALLOW_REMOTE_FLAG}=1,`,
      "   • jen pokud opravdu chcete zasáhnout produkci, spusťte příkaz",
      `     jednorázově s ${DB_ALLOW_REMOTE_FLAG}=1 na začátku řádku.`,
      ""
    ].join("\n")
  )
}

// Used by the application runtime (lib/db.ts).
export function resolveDbTarget(): DbTarget {
  const tursoUrl = process.env.TURSO_DATABASE_URL

  if (tursoUrl) {
    if (!isRemoteAllowed()) {
      blocked(describeRemote(tursoUrl), "TURSO_DATABASE_URL")
    }
    return { kind: "remote-libsql", url: tursoUrl, describe: describeRemote(tursoUrl) }
  }

  // Checked on the raw value: resolveLocalFileUrl() would mangle a
  // `libsql://…` DATABASE_URL into a nonsense local file path, and the guard
  // would then never see that a remote database was asked for.
  const raw = rawDatabaseUrl()
  if (isRemoteUrl(raw)) {
    if (!isRemoteAllowed()) {
      blocked(describeRemote(raw), "DATABASE_URL")
    }
    return { kind: "remote-libsql", url: raw, describe: describeRemote(raw) }
  }

  const localUrl = resolveLocalFileUrl(raw)
  return { kind: "local-file", url: localUrl, describe: localUrl }
}

// Used by the Prisma CLI config (prisma.config.ts), which is what `prisma
// migrate` and `prisma db seed` connect through. Migrations are the most
// destructive thing this repo can run, so the check is the same one.
export function resolveCliDatabaseUrl() {
  const raw = rawDatabaseUrl()

  if (isRemoteUrl(raw)) {
    if (!isRemoteAllowed()) {
      blocked(describeRemote(raw), "DATABASE_URL (Prisma CLI)")
    }
    return raw
  }

  return resolveLocalFileUrl(raw)
}
