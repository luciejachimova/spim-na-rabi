# Nasazení Spim Manageru do produkce

Postup pro první nasazení manager modulu a migrace M1. Projděte shora dolů;
každý krok má uvedeno, co musí platit, než se pokračuje dál.

**Odhad:** 30–45 minut včetně ověřování. Volte dobu, kdy nikdo nerezervuje —
ideálně ráno mezi 7:00 a 9:00, kdy je provoz na webu nejnižší a zbývá celý
den na řešení problémů.

---

## 0. Proč to jde nasadit bez odstávky

Migrace přejmenovává stav rezervace `active` → `confirmed`. Kód a data se
nikdy nezmění ve stejný okamžik, takže by v jakémkoli pořadí vzniklo okno,
kdy si nerozumí — a selhání by bylo tiché a drahé: tabulka plná hodnot
`active` čtená kódem, který zná jen `confirmed`, vypadá jako **úplně volný
kalendář**, a `/api/availability` nabídne hostovi obsazený apartmán.

Nový kód proto starou hodnotu při čtení toleruje (`BLOCKING_STATUSES_FOR_READ`
v `lib/reservations/status.ts` a člen `active` v enumu v `schema.prisma`).
Nic ji nezapisuje. Díky tomu je jedno, jestli proběhne dřív deploy nebo
migrace — obojí pořadí je bezpečné.

Ověřeno lokálně: řádek se stavem `active` se chová jako obsazený ve všech
čtyřech místech, kde na tom záleží — `isBlocking()`, seznam obsazených
termínů, atomická kontrola překryvu při zápisu a iCal export do Bookingu.

---

## 1. Přihlášení k Turso

Všechny následující příkazy potřebují platformové přihlášení. Turso CLI nemá
přepínač pro token — `TURSO_AUTH_TOKEN` z `.env` slouží aplikaci, ne CLI.

```sh
turso auth login          # otevře prohlížeč
turso auth whoami         # ověření
turso db list             # musí vypsat spimnarabi
```

- [ ] `turso auth whoami` vypíše účet
- [ ] `turso db list` obsahuje `spimnarabi`

## 2. Záloha databáze

`turso db export` stáhne skutečný SQLite soubor, ne SQL dump. To je lepší:
zálohu jde rovnou otevřít a přepočítat lokálně, takže „mám zálohu“ není
domněnka.

```sh
mkdir -p ~/spim-zalohy
turso db export spimnarabi \
  --output-file ~/spim-zalohy/spimnarabi-$(date +%Y%m%d-%H%M).db
ls -lh ~/spim-zalohy/
```

**Ověření zálohy — nejen že soubor existuje, ale že v něm jsou data:**

```sh
ZALOHA=$(ls -t ~/spim-zalohy/*.db | head -1)
sqlite3 "$ZALOHA" "PRAGMA integrity_check;"
sqlite3 "$ZALOHA" "SELECT COUNT(*) FROM reservations;"
sqlite3 "$ZALOHA" "SELECT status, COUNT(*) FROM reservations GROUP BY status;"
sqlite3 "$ZALOHA" "SELECT COUNT(*) FROM apartments;"
```

- [ ] `integrity_check` vrátí `ok`
- [ ] Počet rezervací odpovídá tomu, co vidíte v adminu: ________
- [ ] Apartmány jsou 2
- [ ] Zálohu máte i mimo notebook (Disk, e-mail sám sobě — cokoli)

**Nepovinné, ale doporučené: vyzkoušet obnovu dřív, než ji budete
potřebovat.** Vytvoří dočasnou databázi vedle produkce, nic nepřepíše.

```sh
turso db create spim-restore-test --from-file "$ZALOHA"
turso db shell spim-restore-test "SELECT id, start_date, source, name FROM reservations ORDER BY id;"
turso db shell spimnarabi        "SELECT id, start_date, source, name FROM reservations ORDER BY id;"
turso db destroy spim-restore-test --yes
```

- [ ] Oba výpisy jsou shodné → rollback ze zálohy prokazatelně funguje

**Provedeno 31. 7. 2026:** obnova ze zálohy `spimnarabi-20260731-1248.db`
vrátila všechny 3 rezervace i oba apartmány shodné s produkcí. Testovací
databáze smazána.

> Bez ověřené zálohy nepokračujte. Krok 5 obsahuje `DROP TABLE`.

## 3. Kontrola stavu před zásahem

```sh
turso db shell spimnarabi "SELECT status, COUNT(*) FROM reservations GROUP BY status;"
turso db shell spimnarabi "SELECT COUNT(*) FROM reservations;"
turso db shell spimnarabi "SELECT name FROM sqlite_master WHERE type='table';"
```

Zapište si čísla — po migraci musí sedět.

**Naměřeno 31. 7. 2026 12:48** (kroky 1–3 provedeny předem, migrace odložena
na pondělí ráno). Pokud se v pondělí čísla liší, mezitím přibyla rezervace —
udělejte novou zálohu a čísla přepište.

| | |
| --- | --- |
| Rezervace celkem | **3** |
| Z toho `active` | **3** (žádná `cancelled`) |
| Podle zdroje | `website` 2, `admin_block` 1 |
| Apartmány | **2** |
| `ical_feeds` | **0 — žádný Booking/Airbnb feed nastavený** |
| Tabulka `guests` | neexistuje ✓ |
| Schéma | odpovídá migraci `20260710084337_add_reservation_locale` |

Konkrétní rezervace, podle kterých jde po migraci ověřit, že se nic
neztratilo:

```
3   2026-07-18 → 2026-07-25   admin_block   (bez jména)
6   2026-07-07 → 2026-07-09   website       Lucie Myslík
7   2026-07-14 → 2026-07-17   website       Pavel Myslík
```

> **Pozor na smoke test:** protože žádný iCal feed nastavený není, oddíl
> „Ochrana ručních úprav“ v kroku 6 **nelze na produkci provést** — není
> žádná rezervace z Booking.com. Ověřeno jen lokálně (`npm run check:sync`,
> 41 kontrol). Až feedy zapojíte, projděte ten oddíl znovu.

## 4. Migrace

Dvě migrace, **v tomto pořadí a s ověřením mezi nimi**.

### 4a. Aditivní část — nemůže ztratit data

```sh
turso db shell spimnarabi < prisma/migrations/20260728112605_manager_foundation/migration.sql
```

Samé `ALTER TABLE ADD COLUMN`, `CREATE TABLE`, `CREATE INDEX` a dva `UPDATE`.
Kdyby to spadlo uprostřed, nic se neztratí — nanejvýš doběhne jen část
sloupců a příkaz se dá pustit znovu po odstranění už přidaných.

**Ověření:**

```sh
turso db shell spimnarabi "SELECT status, COUNT(*) FROM reservations GROUP BY status;"
turso db shell spimnarabi "SELECT COUNT(*) FROM reservations;"
turso db shell spimnarabi "SELECT COUNT(*) FROM guests;"
turso db shell spimnarabi "SELECT id, adults, children, price_cents, currency FROM reservations LIMIT 5;"
```

- [ ] Celkový počet rezervací je **stejný** jako v kroku 3
- [ ] Žádný řádek už nemá `active`, všechny jsou `confirmed`
- [ ] `adults` je vyplněné (převzalo se z původního `guests`), `children` = 0
- [ ] `currency` = `CZK`
- [ ] Tabulka `guests` existuje a je prázdná

### 4b. Přestavbová část — jediný krok s `DROP TABLE`

```sh
turso db shell spimnarabi < prisma/migrations/20260728113500_align_reservation_defaults/migration.sql
```

Srovnává výchozí hodnotu sloupce `status`, což SQLite neumí změnit na místě.
Kdyby selhala, **aplikace i tak funguje** — 4a už dodala všechno potřebné.
V takovém případě migraci nezkoušejte znovu naslepo, ozvěte se.

**Ověření:**

```sh
turso db shell spimnarabi "SELECT COUNT(*) FROM reservations;"
turso db shell spimnarabi "SELECT sql FROM sqlite_master WHERE name='reservations';" | grep -o "status.*DEFAULT '[a-z_]*'"
```

- [ ] Počet rezervací je pořád stejný
- [ ] Výchozí hodnota sloupce `status` je `confirmed`

## 5. Nasazení kódu

```sh
git push origin feat/manager-foundation
# na GitHubu otevřít PR do main a slouči, nebo:
git checkout main && git merge feat/manager-foundation && git push
```

Vercel nasadí sám. Počkejte, až bude deployment ve stavu **Ready**.

- [ ] Deployment prošel bez chyb v buildu
- [ ] `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `ADMIN_PASSWORD`,
      `ADMIN_SESSION_SECRET`, `CRON_SECRET`, `SMTP_*` jsou pro prostředí
      Production nastavené (nic z toho se nemění, jen kontrola)
- [ ] `DB_ALLOW_REMOTE` na Vercelu nastavovat **netřeba** — platforma sama
      nastavuje `VERCEL=1`

## 6. Smoke test

### Veřejný web — nejdřív to, co vidí hosté

- [ ] `https://www.spimnarabi.cz` se načte
- [ ] Rezervační kalendář ukazuje obsazené termíny (**ne prázdný!**)
- [ ] `https://www.spimnarabi.cz/api/availability` vrací `busyRanges`
      odpovídající skutečné obsazenosti
- [ ] `https://www.spimnarabi.cz/api/ical/studio-3` vrací `.ics` s událostmi
- [ ] Zkušební rezervace přes web projde a přijde potvrzovací e-mail
      (pak ji v manageru stornujte)

> Prázdný kalendář nebo prázdné `busyRanges` znamenají okamžitý rollback —
> v tom stavu si host může zarezervovat obsazený apartmán.

### Synchronizace

- [ ] `/admin/sync` → **Synchronizovat nyní** proběhne bez chyby
- [ ] Odpověď obsahuje `created`, `updated`, `cancelled`
- [ ] Druhé spuštění hned po prvním hlásí samé nuly (nic se nepřepisuje)
- [ ] V `/admin/reservations` nezmizely žádné rezervace

### Manager

- [ ] `https://www.spimnarabi.cz/manager` přesměruje na přihlášení
- [ ] Po přihlášení se otevře seznam rezervací se skutečnými daty
- [ ] Filtry (období, apartmán, stav, zdroj, pes) fungují
- [ ] Detail rezervace ukazuje termín, hosty, cenu
- [ ] Vytvoření zkušební rezervace projde
- [ ] Kolizní termín se ohlásí **hned při výběru data**
- [ ] Editace zkušební rezervace uloží změny
- [ ] Storno zkušební rezervace nastaví stav Zrušeno
- [ ] Adresář hostů se naplnil
- [ ] Zkušební rezervaci nakonec smažte

### Ochrana ručních úprav — nejdůležitější zkouška

- [ ] U rezervace z Booking.com doplňte jméno, telefon a cenu
- [ ] Spusťte `/admin/sync` → **Synchronizovat nyní**
- [ ] **Jméno, telefon i cena tam pořád jsou**

### PWA

- [ ] `https://www.spimnarabi.cz/manager/manifest.webmanifest` vrací JSON
- [ ] `/manager/icons/192` vrací PNG
- [ ] Android Chrome: menu ⋮ → *Přidat na plochu*, ikona se objeví
- [ ] iPhone Safari: Sdílet → *Přidat na plochu*, appka se otevře na celou
      obrazovku a po přihlášení skončí na `/manager` (ne na `/admin`)
- [ ] Desktop Chrome: v adresním řádku se nabídne instalace

### Po 15–20 minutách

- [ ] Cron na cron-job.org proběhl (Execution history → HTTP 200)
- [ ] Ve Vercel logs u `/api/cron/reservations` nejsou chyby
- [ ] Rezervace pořád sedí

---

## 7. Rollback

### Kdy rollovat okamžitě

- Veřejný kalendář ukazuje volno tam, kde je obsazeno
- `/api/availability` vrací prázdné `busyRanges`
- Rezervace zmizely nebo jich je míň než v kroku 2
- Web nebo admin vrací 500

### A) Jen kód (data jsou v pořádku)

Nejčastější případ — rozbité UI, funkční databáze.

Ve Vercelu: **Deployments** → poslední fungující → **⋯** → *Promote to
Production*. Trvá to pod minutu.

> Starý kód rozumí i nové hodnotě `confirmed`? **Ne.** Proto po návratu na
> starý kód musíte vrátit i data — viz níže. Bez toho by starý kód viděl
> prázdný kalendář.

```sh
turso db shell spimnarabi "UPDATE reservations SET status='active' WHERE status='confirmed';"
```

Nové sloupce starému kódu nevadí, ten je prostě ignoruje.

- [ ] Po vrácení zkontrolujte `/api/availability` — musí ukazovat obsazenost

### B) Kód i data (migrace dopadla špatně)

Dvě cesty, obě do **nové** databáze — živá zůstane nedotčená pro dohledání,
co se pokazilo, a přepnutí zpět je jedna proměnná prostředí.

**Lepší: obnova k okamžiku před migrací.** Turso drží historii, takže nemusíte
spoléhat na zálohu a neztratíte rezervace, které mezitím přišly. Čas zadejte
v RFC3339 a zvolte okamžik těsně před krokem 4.

```sh
turso db create spimnarabi-rollback \
  --from-db spimnarabi --timestamp 2026-07-31T07:45:00+02:00
```

**Náhradní: ze zálohy z kroku 2.**

```sh
ZALOHA=$(ls -t ~/spim-zalohy/*.db | head -1)
turso db create spimnarabi-rollback --from-file "$ZALOHA"
```

Potom u obou:

```sh
turso db show spimnarabi-rollback --url
# Vercel → Settings → Environment Variables → Production:
#   TURSO_DATABASE_URL přepsat na vypsanou adresu
# Vercel → Deployments → Redeploy
```

**Ztráta dat:** u obnovy k času žádná až po zvolený okamžik. U obnovy ze
zálohy rezervace vzniklé mezi zálohou a rollbackem. Proto se nasazuje ráno
a proto se hned po kroku 6 kontroluje, že web a cron fungují — čím dřív se
problém najde, tím menší okno.

- [ ] Po obnově zkontrolujte počet rezervací proti kroku 3
- [ ] Spusťte ruční sync, aby se dotáhlo, co mezitím přišlo z Bookingu

---

## 8. Úklid po úspěšném nasazení

Nechte běžet **aspoň týden**, ať je jisté, že se nic nevrací.

Potom odstraňte přechodovou toleranci staré hodnoty:

1. `prisma/schema.prisma` → člen `active` z enumu `ReservationStatus`
2. `lib/reservations/types.ts` → `"active"` z typu `ReservationStatus`
3. `lib/reservations/status.ts` → `LEGACY_ACTIVE`,
   `BLOCKING_STATUSES_FOR_READ`, `EMAILABLE_STATUSES_FOR_READ` a položku
   `active` z `RESERVATION_STATUS_LABELS`; volající vrátit na
   `BLOCKING_STATUSES` / `EMAILABLE_STATUSES`
4. `npm run check` a `npm run build`

Ověřte, že v databázi opravdu žádná stará hodnota nezbyla:

```sh
turso db shell spimnarabi "SELECT COUNT(*) FROM reservations WHERE status='active';"
```

- [ ] Vrací 0

Dál zůstává na později (fáze 5): odstranění zděděného sloupce `guests`,
který se dnes drží dopočítaný jako `adults + children`.
