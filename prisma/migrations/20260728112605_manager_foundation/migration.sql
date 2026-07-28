-- Hand-written, replacing what `prisma migrate dev --create-only` generated.
--
-- Prisma's version rebuilt both tables (CREATE new_… / INSERT … SELECT /
-- DROP TABLE / RENAME). Two problems with that here:
--
--   1. It runs `DROP TABLE "reservations"` against the live production table.
--      Migrations reach Turso by piping this file through `turso db shell`
--      (see README), so a connection drop between DROP and RENAME would take
--      every reservation with it. ALTER TABLE ADD COLUMN cannot lose data.
--   2. Its `INSERT … SELECT` did not carry `guests` into `adults`, so the
--      backfill below would have been silently lost.
--
-- Everything here is additive and re-runnable in the sense that it never
-- destroys an existing row.

-- CreateTable
CREATE TABLE "guests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "email_norm" TEXT,
    "phone" TEXT,
    "phone_norm" TEXT,
    "country" TEXT,
    "note" TEXT,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "street" TEXT,
    "city" TEXT,
    "zip" TEXT,
    "birth_date" TEXT,
    "document_no" TEXT,
    "company_id" TEXT,
    "vat_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "guests_email_norm_idx" ON "guests"("email_norm");
CREATE INDEX "guests_phone_norm_idx" ON "guests"("phone_norm");

-- AlterTable: apartments
ALTER TABLE "apartments" ADD COLUMN "short_label" TEXT;
ALTER TABLE "apartments" ADD COLUMN "description" TEXT;
ALTER TABLE "apartments" ADD COLUMN "area_m2" INTEGER;
ALTER TABLE "apartments" ADD COLUMN "max_adults" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "apartments" ADD COLUMN "max_children" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "apartments" ADD COLUMN "pets_allowed" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "apartments" ADD COLUMN "check_in_from" TEXT NOT NULL DEFAULT '15:00';
ALTER TABLE "apartments" ADD COLUMN "check_out_until" TEXT NOT NULL DEFAULT '10:00';
ALTER TABLE "apartments" ADD COLUMN "cleaning_minutes" INTEGER NOT NULL DEFAULT 90;
ALTER TABLE "apartments" ADD COLUMN "color" TEXT NOT NULL DEFAULT '#333333';
ALTER TABLE "apartments" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "apartments" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: reservations
-- SQLite allows a REFERENCES clause on ADD COLUMN as long as the default is
-- NULL, which it is here — so the guest link needs no table rebuild either.
ALTER TABLE "reservations" ADD COLUMN "guest_id" TEXT REFERENCES "guests" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reservations" ADD COLUMN "last_synced_at" DATETIME;
ALTER TABLE "reservations" ADD COLUMN "manual_edited_at" DATETIME;
ALTER TABLE "reservations" ADD COLUMN "adults" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "reservations" ADD COLUMN "children" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "reservations" ADD COLUMN "children_ages" TEXT;
ALTER TABLE "reservations" ADD COLUMN "has_dog" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "reservations" ADD COLUMN "dogs_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "reservations" ADD COLUMN "price_cents" INTEGER;
ALTER TABLE "reservations" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'CZK';
ALTER TABLE "reservations" ADD COLUMN "deposit_cents" INTEGER;
ALTER TABLE "reservations" ADD COLUMN "is_paid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "reservations" ADD COLUMN "city_tax_cents" INTEGER;
ALTER TABLE "reservations" ADD COLUMN "guest_note" TEXT;
ALTER TABLE "reservations" ADD COLUMN "arrival_time" TEXT;
ALTER TABLE "reservations" ADD COLUMN "departure_time" TEXT;
ALTER TABLE "reservations" ADD COLUMN "cancelled_at" DATETIME;
ALTER TABLE "reservations" ADD COLUMN "cancel_reason" TEXT;

-- Backfill: the legacy `guests` total becomes the adult count. Prisma does
-- not generate data migrations, so this is written by hand. `guests` itself
-- is kept (and from now on written as adults + children) because dropping a
-- column on SQLite requires the table rebuild this migration exists to avoid.
UPDATE "reservations" SET "adults" = COALESCE("guests", 2), "children" = 0;

-- Rename the status value. An enum on SQLite is a plain TEXT column with no
-- CHECK constraint, so Prisma emits no SQL at all for an enum change — the
-- data update has to be written by hand or every existing row keeps a value
-- the application no longer knows.
UPDATE "reservations" SET "status" = 'confirmed' WHERE "status" = 'active';

-- CreateIndex
CREATE INDEX "reservations_start_date_idx" ON "reservations"("start_date");
CREATE INDEX "reservations_end_date_idx" ON "reservations"("end_date");
CREATE INDEX "reservations_status_idx" ON "reservations"("status");
