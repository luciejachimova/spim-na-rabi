import path from "node:path"
import "dotenv/config"
import { defineConfig } from "prisma/config"

// SQLite `file:` URLs in DATABASE_URL are relative, but Prisma resolves
// relative paths inconsistently between the CLI and the generated client.
// Anchoring to process.cwd() here (and in lib/db.ts) keeps both consistent.
function resolveDatabaseUrl() {
  const raw = process.env.DATABASE_URL || "file:./storage/development.sqlite3"
  const filePath = raw.replace(/^file:/, "")
  return path.isAbsolute(filePath) ? raw : `file:${path.resolve(process.cwd(), filePath)}`
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  engine: "classic",
  datasource: {
    url: resolveDatabaseUrl(),
  },
})
