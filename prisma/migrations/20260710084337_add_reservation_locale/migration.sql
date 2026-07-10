-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_reservations" (
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
    CONSTRAINT "reservations_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "apartments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_reservations" ("apartment_id", "arrival_info_email_attempted_at", "arrival_info_email_attempts", "arrival_info_emailed_at", "confirmation_email_attempted_at", "confirmation_email_attempts", "confirmation_emailed_at", "created_at", "departure_reminder_email_attempted_at", "departure_reminder_email_attempts", "departure_reminder_emailed_at", "email", "end_date", "external_uid", "guests", "id", "last_email_error", "name", "note", "phone", "reservation_token", "source", "start_date", "status", "thank_you_email_attempted_at", "thank_you_email_attempts", "thank_you_emailed_at", "updated_at") SELECT "apartment_id", "arrival_info_email_attempted_at", "arrival_info_email_attempts", "arrival_info_emailed_at", "confirmation_email_attempted_at", "confirmation_email_attempts", "confirmation_emailed_at", "created_at", "departure_reminder_email_attempted_at", "departure_reminder_email_attempts", "departure_reminder_emailed_at", "email", "end_date", "external_uid", "guests", "id", "last_email_error", "name", "note", "phone", "reservation_token", "source", "start_date", "status", "thank_you_email_attempted_at", "thank_you_email_attempts", "thank_you_emailed_at", "updated_at" FROM "reservations";
DROP TABLE "reservations";
ALTER TABLE "new_reservations" RENAME TO "reservations";
CREATE UNIQUE INDEX "reservations_reservation_token_key" ON "reservations"("reservation_token");
CREATE INDEX "reservations_apartment_id_start_date_end_date_idx" ON "reservations"("apartment_id", "start_date", "end_date");
CREATE UNIQUE INDEX "reservations_apartment_id_source_external_uid_key" ON "reservations"("apartment_id", "source", "external_uid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
