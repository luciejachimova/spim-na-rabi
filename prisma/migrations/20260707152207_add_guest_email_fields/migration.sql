-- AlterTable
ALTER TABLE "reservations" ADD COLUMN "reservation_token" TEXT;
ALTER TABLE "reservations" ADD COLUMN "confirmation_emailed_at" DATETIME;
ALTER TABLE "reservations" ADD COLUMN "confirmation_email_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "reservations" ADD COLUMN "confirmation_email_attempted_at" DATETIME;
ALTER TABLE "reservations" ADD COLUMN "arrival_info_emailed_at" DATETIME;
ALTER TABLE "reservations" ADD COLUMN "arrival_info_email_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "reservations" ADD COLUMN "arrival_info_email_attempted_at" DATETIME;
ALTER TABLE "reservations" ADD COLUMN "departure_reminder_emailed_at" DATETIME;
ALTER TABLE "reservations" ADD COLUMN "departure_reminder_email_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "reservations" ADD COLUMN "departure_reminder_email_attempted_at" DATETIME;
ALTER TABLE "reservations" ADD COLUMN "thank_you_emailed_at" DATETIME;
ALTER TABLE "reservations" ADD COLUMN "thank_you_email_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "reservations" ADD COLUMN "thank_you_email_attempted_at" DATETIME;
ALTER TABLE "reservations" ADD COLUMN "last_email_error" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "reservations_reservation_token_key" ON "reservations"("reservation_token");
