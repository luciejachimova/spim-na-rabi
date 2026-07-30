import "dotenv/config"
import { defineConfig } from "prisma/config"
import { resolveCliDatabaseUrl } from "./lib/db-target"

// SQLite `file:` URLs in DATABASE_URL are relative, but Prisma resolves
// relative paths inconsistently between the CLI and the generated client.
// Anchoring to process.cwd() (see lib/db-target.ts, shared with lib/db.ts)
// keeps both consistent.
//
// resolveCliDatabaseUrl() additionally refuses a remote database unless
// running on Vercel or DB_ALLOW_REMOTE=1 is set: this is the connection
// `prisma migrate` and `prisma db seed` use, so it is the one place where a
// stray environment variable could rewrite production.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  engine: "classic",
  datasource: {
    url: resolveCliDatabaseUrl(),
  },
})
