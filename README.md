# spim-na-rabi-app

Next.js 16 aplikace (TypeScript, React 19, Tailwind CSS, SQLite).

## Lokální vývoj

Předpoklady: Node.js 22.5+.

```sh
git clone <repo>
cd spim-na-rabi-app
cp .env.example .env   # a doplňte skutečné hodnoty
npm install
npm run dev
```

Aplikace poběží na <http://localhost:3000>. Databáze (SQLite v `storage/development.sqlite3`) se schématem a základními apartmány se vytvoří automaticky při prvním requestu.

### Užitečné příkazy

```sh
npm run dev         # vývojový server
npm run build       # produkční build
npm run start       # spuštění produkčního buildu
npm run lint        # ESLint
npm run typecheck   # kontrola TypeScript typů
```

## Lokální vývoj v Dockeru

```sh
docker compose up --build   # první spuštění - build image
docker compose up           # následující spuštění - rychlejší
docker compose down          # zastavit
docker compose down -v       # zastavit a smazat i uložená data
```
