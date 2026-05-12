# spim-na-rabi-app

Rails 8.1 aplikace (Ruby 3.4.9, SQLite, Tailwind, Hotwire, importmap).

## Lokální vývoj v Dockeru

Předpoklady: Docker Desktop.

```sh
git clone <repo>
cd spim-na-rabi-app
docker compose up --build # První spuštění - build image
docker compose up       # Následující spuštění - rychlejší, protože image je již vytvořená
```

Aplikace poběží na <http://localhost:3000>. Při prvním spuštění proběhne `bundle install` a `db:prepare`, takže start chvíli trvá.

### Užitečné příkazy

```sh
docker compose run --rm web bin/rails console
docker compose run --rm web bin/rails generate controller Pages home
docker compose run --rm web bundle add <gem>
docker compose down            # zastavit
docker compose down -v         # zastavit a smazat DB i nainstalované gemy
```

### Lokální vývoj bez Dockeru

```sh
bundle install
bin/dev
```
