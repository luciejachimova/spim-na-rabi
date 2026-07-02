-- CreateTable
CREATE TABLE "apartments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "public_ical_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ical_feeds" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "apartment_id" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "last_synced_at" DATETIME,
    "last_sync_error" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ical_feeds_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "apartments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "apartment_id" INTEGER NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'website',
    "status" TEXT NOT NULL DEFAULT 'active',
    "external_uid" TEXT,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "guests" INTEGER,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reservations_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "apartments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "apartments_slug_key" ON "apartments"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ical_feeds_apartment_id_provider_key" ON "ical_feeds"("apartment_id", "provider");

-- CreateIndex
CREATE INDEX "reservations_apartment_id_start_date_end_date_idx" ON "reservations"("apartment_id", "start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_apartment_id_source_external_uid_key" ON "reservations"("apartment_id", "source", "external_uid");
