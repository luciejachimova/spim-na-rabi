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

## 1. Záloha databáze

```sh
mkdir -p ~/spim-zalohy
turso db dump spimnarabi > ~/spim-zalohy/spimnarabi-$(date +%Y%m%d-%H%M).sql
ls -lh ~/spim-zalohy/
```

**Musí platit, než pokračujete:**

- [ ] Soubor existuje a má víc než pár kilobajtů (prázdný dump = neproběhlo).
- [ ] `grep -c "INSERT INTO reservations" ~/spim-zalohy/…sql` vrátí zhruba
      počet rezervací, které v adminu vidíte.
- [ ] Zálohu máte i mimo notebook (Disk, e-mail sám sobě — cokoli).

> Bez ověřené zálohy nepokračujte. Krok 3 obsahuje `DROP TABLE`.

## 2. Kontrola stavu před zásahem

```sh
turso db shell spimnarabi "SELECT status, COUNT(*) FROM reservations GROUP BY status;"
turso db shell spimnarabi "SELECT COUNT(*) FROM reservations;"
turso db shell spimnarabi "SELECT name FROM sqlite_master WHERE type='table';"
```

Zapište si čísla — po migraci se musí sedět.

- [ ] Počet rezervací: ________
- [ ] Z toho `active`: ________, `cancelled`: ________
- [ ] Tabulka `guests` **neexistuje** (jinak už něco proběhlo)

## 3. Migrace

Dvě migrace, **v tomto pořadí a s ověřením mezi nimi**.

### 3a. Aditivní část — nemůže ztratit data

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

- [ ] Celkový počet rezervací je **stejný** jako v kroku 2
- [ ] Žádný řádek už nemá `active`, všechny jsou `confirmed`
- [ ] `adults` je vyplněné (převzalo se z původního `guests`), `children` = 0
- [ ] `currency` = `CZK`
- [ ] Tabulka `guests` existuje a je prázdná

### 3b. Přestavbová část — jediný krok s `DROP TABLE`

```sh
turso db shell spimnarabi < prisma/migrations/20260728113500_align_reservation_defaults/migration.sql
```

Srovnává výchozí hodnotu sloupce `status`, což SQLite neumí změnit na místě.
Kdyby selhala, **aplikace i tak funguje** — 3a už dodala všechno potřebné.
V takovém případě migraci nezkoušejte znovu naslepo, ozvěte se.

**Ověření:**

```sh
turso db shell spimnarabi "SELECT COUNT(*) FROM reservations;"
turso db shell spimnarabi "SELECT sql FROM sqlite_master WHERE name='reservations';" | grep -o "status.*DEFAULT '[a-z_]*'"
```

- [ ] Počet rezervací je pořád stejný
- [ ] Výchozí hodnota sloupce `status` je `confirmed`

## 4. Nasazení kódu

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

## 5. Smoke test

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

## 6. Rollback

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

```sh
# 1. Vrátit deployment ve Vercelu (viz A)

# 2. Obnovit databázi ze zálohy do NOVÉ databáze, ne přes živou
turso db create spimnarabi-rollback --from-dump ~/spim-zalohy/spimnarabi-….sql
turso db show spimnarabi-rollback --url

# 3. Přepnout TURSO_DATABASE_URL ve Vercelu na obnovenou databázi
#    (Settings → Environment Variables → Production) a spustit redeploy
```

Obnova do nové databáze místo přepisu živé je záměr: původní zůstane
nedotčená pro dohledání toho, co se pokazilo, a přepnutí je jedna proměnná
prostředí tam i zpět.

**Ztráta dat:** rezervace vzniklé mezi zálohou a rollbackem. Proto se
nasazuje ráno a proto se hned po kroku 5 kontroluje, že cron a web fungují —
čím dřív se problém najde, tím menší okno.

- [ ] Po obnově zkontrolujte počet rezervací proti kroku 2
- [ ] Spusťte ruční sync, aby se dotáhlo, co mezitím přišlo z Bookingu

---

## 7. Úklid po úspěšném nasazení

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
