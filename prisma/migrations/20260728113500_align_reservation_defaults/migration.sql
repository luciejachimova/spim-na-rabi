-- Second half of M1, deliberately kept separate from the additive migration.
--
-- SQLite cannot change a column DEFAULT with ALTER TABLE, so aligning
-- reservations.status (DEFAULT 'active' -> 'confirmed') and naming the
-- guest_id foreign key requires the table rebuild below. That rebuild is
-- exactly what the previous migration avoids for the data-carrying part.
--
-- Why it is still worth doing once, rather than living with the drift:
-- Prisma compares the database against schema.prisma every time it generates
-- a migration. Left unaligned, EVERY future migration would silently carry
-- this same DROP TABLE with it. Better one deliberate rebuild, taken with a
-- backup in hand, than an unnoticed one attached to some later change.
--
-- Ordering matters on production: apply the additive migration first and
-- verify the app, then this one. If this one fails, the previous migration
-- has already delivered everything the application actually needs.

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_reservations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "apartment_id" INTEGER NOT NULL,
    "guest_id" TEXT,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'website',
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "external_uid" TEXT,
    "last_synced_at" DATETIME,
    "manual_edited_at" DATETIME,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "guests" INTEGER,
    "adults" INTEGER NOT NULL DEFAULT 2,
    "children" INTEGER NOT NULL DEFAULT 0,
    "children_ages" TEXT,
    "has_dog" BOOLEAN NOT NULL DEFAULT false,
    "dogs_count" INTEGER NOT NULL DEFAULT 0,
    "price_cents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'CZK',
    "deposit_cents" INTEGER,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "city_tax_cents" INTEGER,
    "note" TEXT,
    "guest_note" TEXT,
    "arrival_time" TEXT,
    "departure_time" TEXT,
    "cancelled_at" DATETIME,
    "cancel_reason" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'cs',
    "reservation_token" TEXT,
    "confirmation_emailed_at" DATETIME,
    "confirmation_email_attempts" INTEGER NOT NULL DEFAULT 0,
    "confirmation_email_attempted_at" DATETIME,
    "arrival_info_emailed_at" DATETIME,
    "arrival_info_email_attempts" INTEGER NOT NULL DEFAULT 0,
    "arrival_info_email_attempted_at" DATETIME,
    "departure_reminder_emailed_at" DATETIME,
    "departure_reminder_email_attempts" INTEGER NOT NULL DEFAULT 0,
    "departure_reminder_email_attempted_at" DATETIME,
    "thank_you_emailed_at" DATETIME,
    "thank_you_email_attempts" INTEGER NOT NULL DEFAULT 0,
    "thank_you_email_attempted_at" DATETIME,
    "last_email_error" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reservations_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "apartments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reservations_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_reservations" ("adults", "apartment_id", "arrival_info_email_attempted_at", "arrival_info_email_attempts", "arrival_info_emailed_at", "arrival_time", "cancel_reason", "cancelled_at", "children", "children_ages", "city_tax_cents", "confirmation_email_attempted_at", "confirmation_email_attempts", "confirmation_emailed_at", "created_at", "currency", "departure_reminder_email_attempted_at", "departure_reminder_email_attempts", "departure_reminder_emailed_at", "departure_time", "deposit_cents", "dogs_count", "email", "end_date", "external_uid", "guest_id", "guest_note", "guests", "has_dog", "id", "is_paid", "last_email_error", "last_synced_at", "locale", "manual_edited_at", "name", "note", "phone", "price_cents", "reservation_token", "source", "start_date", "status", "thank_you_email_attempted_at", "thank_you_email_attempts", "thank_you_emailed_at", "updated_at") SELECT "adults", "apartment_id", "arrival_info_email_attempted_at", "arrival_info_email_attempts", "arrival_info_emailed_at", "arrival_time", "cancel_reason", "cancelled_at", "children", "children_ages", "city_tax_cents", "confirmation_email_attempted_at", "confirmation_email_attempts", "confirmation_emailed_at", "created_at", "currency", "departure_reminder_email_attempted_at", "departure_reminder_email_attempts", "departure_reminder_emailed_at", "departure_time", "deposit_cents", "dogs_count", "email", "end_date", "external_uid", "guest_id", "guest_note", "guests", "has_dog", "id", "is_paid", "last_email_error", "last_synced_at", "locale", "manual_edited_at", "name", "note", "phone", "price_cents", "reservation_token", "source", "start_date", "status", "thank_you_email_attempted_at", "thank_you_email_attempts", "thank_you_emailed_at", "updated_at" FROM "reservations";
DROP TABLE "reservations";
ALTER TABLE "new_reservations" RENAME TO "reservations";
CREATE UNIQUE INDEX "reservations_reservation_token_key" ON "reservations"("reservation_token");
CREATE INDEX "reservations_apartment_id_start_date_end_date_idx" ON "reservations"("apartment_id", "start_date", "end_date");
CREATE INDEX "reservations_start_date_idx" ON "reservations"("start_date");
CREATE INDEX "reservations_end_date_idx" ON "reservations"("end_date");
CREATE INDEX "reservations_status_idx" ON "reservations"("status");
CREATE UNIQUE INDEX "reservations_apartment_id_source_external_uid_key" ON "reservations"("apartment_id", "source", "external_uid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

