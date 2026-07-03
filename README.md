# spim-na-rabi-app

Next.js 16 aplikace (TypeScript, React 19, Tailwind CSS, SQLite přes Prisma).

## Lokální vývoj

Předpoklady: Node.js 22.5+.

```sh
git clone <repo>
cd spim-na-rabi-app
cp .env.example .env   # a doplňte skutečné hodnoty
npm install            # spustí i `prisma generate`
npx prisma migrate dev # vytvoří schéma v storage/development.sqlite3
npx prisma db seed     # naseeduje oba apartmány
npm run dev
```

Aplikace poběží na <http://localhost:3000>.

### Užitečné příkazy

```sh
npm run dev         # vývojový server
npm run build       # produkční build
npm run start       # spuštění produkčního buildu
npm run lint        # ESLint
npm run typecheck   # kontrola TypeScript typů
npm run db:studio   # Prisma Studio - prohlížení/úprava dat v databázi
```

## Lokální vývoj v Dockeru

```sh
docker compose up --build   # první spuštění - build image
docker compose up           # následující spuštění - rychlejší
docker compose down          # zastavit
docker compose down -v       # zastavit a smazat i uložená data
```

## Nasazení na Vercel

Vercel funkce běží na efemérním, needitovatelném disku (kromě `/tmp`, který
se nesdílí mezi requesty) — souborová SQLite databáze (`DATABASE_URL`
s `file:...`) tam proto nemůže fungovat jako perzistentní úložiště. Aplikace
proto na Vercelu používá [Turso](https://turso.tech) (libSQL) — hostovanou
databázi kompatibilní se SQLite s bezplatným tarifem. Lokální vývoj se tím
nemění, pořád běží nad lokálním souborem.

### 1) Vytvořit Turso databázi

```sh
curl -sSfL https://get.tur.so/install.sh | bash   # instalace Turso CLI
turso auth login
turso db create spimnarabi
turso db show spimnarabi --url        # -> TURSO_DATABASE_URL
turso db tokens create spimnarabi     # -> TURSO_AUTH_TOKEN
```

### 2) Aplikovat schéma do Turso databáze

Prisma Migrate se nepřipojuje přímo k `libsql://` URL, migrace se proto do
Turso databáze nahrávají přes Turso CLI:

```sh
turso db shell spimnarabi < prisma/migrations/20260701134637_init/migration.sql
```

(při každé nové migraci zopakujte se souborem nové migrace).

### 3) Naseedovat apartmány do Turso databáze

Seed skript používá stejného Prisma klienta jako aplikace (`lib/db.ts`), takže
stačí ho spustit lokálně s Turso proměnnými nastavenými pro tento jeden příkaz:

```sh
TURSO_DATABASE_URL="libsql://spimnarabi-xxxx.turso.io" \
TURSO_AUTH_TOKEN="..." \
npx tsx prisma/seed.ts
```

### 4) Nastavit proměnné prostředí ve Vercelu

V nastavení projektu (Settings → Environment Variables, prostředí Production)
přidejte `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` a ostatní proměnné z
`.env.example` (`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `CRON_SECRET`,
SMTP_* atd.). `DATABASE_URL` na Vercelu nastavovat nemusíte — jakmile je
`TURSO_DATABASE_URL` vyplněné, aplikace se automaticky připojí k Turso místo
k lokálnímu souboru (viz `lib/db.ts`).
