-- CreateEnum
CREATE TYPE "PartnerTier" AS ENUM ('GOLD', 'SILVER', 'BRONZE');

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "capOverrideAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Sponsor" ADD COLUMN     "anonymous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "displayName" TEXT;

-- CreateTable
CREATE TABLE "CorporatePartner" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "website" TEXT,
    "logoData" BYTEA,
    "logoType" TEXT,
    "logoKey" TEXT,
    "pledgeCents" INTEGER,
    "message" TEXT,
    "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING',
    "tierOverride" "PartnerTier",
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporatePartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminLoginAttempt" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CorporatePartner_logoKey_key" ON "CorporatePartner"("logoKey");

-- CreateIndex
CREATE INDEX "CorporatePartner_status_idx" ON "CorporatePartner"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CorporatePartner_seasonId_sponsorId_key" ON "CorporatePartner"("seasonId", "sponsorId");

-- CreateIndex
CREATE INDEX "AdminLoginAttempt_ip_createdAt_idx" ON "AdminLoginAttempt"("ip", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailLog_kind_refId_key" ON "EmailLog"("kind", "refId");

-- AddForeignKey
ALTER TABLE "CorporatePartner" ADD CONSTRAINT "CorporatePartner_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporatePartner" ADD CONSTRAINT "CorporatePartner_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
