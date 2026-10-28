-- Pickup day, and when each family was sent the pickup reminder.
ALTER TABLE "Application" ADD COLUMN     "pickupReminderSentAt" TIMESTAMP(3);

ALTER TABLE "Season" ADD COLUMN     "pickupDate" TIMESTAMP(3);
