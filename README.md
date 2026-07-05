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

## Pravidelná synchronizace s Booking.com/Airbnb (externí cron)

Endpoint `/api/cron/reservations` stahuje iCal feedy nastavené v adminu
(`/admin`) a promítá je do rezervací. Nic ho ale samo o sobě pravidelně
nespouští — na Vercel Hobby (free) plánu totiž vestavěné Vercel Cron Jobs
běží nejvýše 1× denně, což na sledování obsazenosti nestačí. Řešením je
externí cron služba, která endpoint pravidelně zavolá přes HTTP.

**Doporučená služba: [cron-job.org](https://cron-job.org)** — zdarma,
spolehlivá (provozovaná přes 15 let), umožňuje vlastní HTTP hlavičky
a interval až 1× za minutu i na free tarifu. Žádná platba, žádné API klíče
navíc.

**Doporučená frekvence: každých 15 minut.** Dost často na to, aby se nová
rezervace z Bookingu/Airbnb promítla rychle, a zároveň šetrné k free tarifu
cílové služby i k limitům Vercel funkcí.

### Zabezpečení endpointu

Endpoint bez platného `CRON_SECRET` v `Authorization` hlavičce (nebo
alternativně `x-cron-secret` hlavičce, nebo `?secret=` parametru v URL)
vrací `401`. Pokud `CRON_SECRET` není na serveru vůbec nastavené, endpoint
se **záměrně sám uzamkne** (vrací `500`) — nikdy tedy neběží nezabezpečený
ve veřejném přístupu.

### Návod: propojení cron-job.org s projektem

1. Ujistěte se, že proměnná `CRON_SECRET` je nastavená ve Vercel
   Environment Variables (viz krok 4 výše) — vygenerujte si dlouhý náhodný
   řetězec, např. `openssl rand -hex 32`.
2. Zaregistrujte se zdarma na [cron-job.org](https://cron-job.org).
3. Vytvořte nový cronjob (**Create cronjob**):
   - **URL**: `https://www.spimnarabi.cz/api/cron/reservations`
   - **Schedule**: každých 15 minut (`*/15 * * * *`, nebo v UI zvolte
     "Every 15 minutes")
   - **Request method**: `GET`
   - **Headers** → přidejte hlavičku `Authorization` s hodnotou
     `Bearer <hodnota CRON_SECRET>`
4. Uložte a nechte proběhnout první test spuštění (cron-job.org nabízí
   tlačítko "Test run" / "Execute now") — odpověď by měla mít HTTP 200
   a JSON tvaru `{"feeds": [...], "durationMs": ...}`.
5. V historii spuštění (Execution history) na cron-job.org lze zpětně
   zkontrolovat HTTP status a délku odpovědi každého běhu; podrobný průběh
   (který feed se stáhl, kolik rezervací se vytvořilo/aktualizovalo, případné
   chyby) je navíc vidět ve Vercel function logs pro `/api/cron/reservations`.

Selhání jednoho feedu (např. dočasně nedostupná URL od Bookingu) nezastaví
synchronizaci ostatních apartmánů/poskytovatelů — chyba se zaloguje a zapíše
k danému feedu (`IcalFeed.lastSyncError`, vidět i v adminu), ale odpověď je
i tak `200` s výsledky za všechny feedy.
