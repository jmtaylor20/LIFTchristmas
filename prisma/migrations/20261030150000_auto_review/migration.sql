-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "annualIncomeCents" INTEGER,
ADD COLUMN     "autoApprovedAt" TIMESTAMP(3),
ADD COLUMN     "hasJob" BOOLEAN,
ADD COLUMN     "infoRequestedAt" TIMESTAMP(3),
ADD COLUMN     "lookingForWork" BOOLEAN,
ADD COLUMN     "missingInfo" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "reviewFlags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Season" ADD COLUMN     "autoApprove" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "incomeLimitCents" INTEGER NOT NULL DEFAULT 5000000;

