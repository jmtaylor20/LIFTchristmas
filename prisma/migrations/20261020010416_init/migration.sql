-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('GIRL', 'BOY');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'WAITLIST', 'DENIED');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('NEEDED', 'CLAIMED', 'RECEIVED', 'MINISTRY');

-- CreateEnum
CREATE TYPE "SponsorshipType" AS ENUM ('FULL', 'PARTIAL');

-- CreateEnum
CREATE TYPE "SponsorshipStatus" AS ENUM ('COMMITTED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DonationMethod" AS ENUM ('ONLINE', 'CASH', 'CHECK', 'OTHER');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "InKindSource" AS ENUM ('AMAZON_WISHLIST', 'DROP_OFF');

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "applicationsOpen" BOOLEAN NOT NULL DEFAULT true,
    "applicationDeadline" TIMESTAMP(3),
    "wishlistDeadline" TIMESTAMP(3),
    "giftDeadline" TIMESTAMP(3),
    "perChildBudgetCents" INTEGER NOT NULL DEFAULT 15000,
    "maxItemsPerChild" INTEGER NOT NULL DEFAULT 8,
    "approvalCapYears" INTEGER NOT NULL DEFAULT 5,
    "amazonWishlistUrl" TEXT,
    "dropOffInstructions" TEXT,
    "donationInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "parentFirstName" TEXT NOT NULL,
    "parentLastName" TEXT NOT NULL,
    "email" TEXT,
    "emailNormalized" TEXT,
    "phone" TEXT NOT NULL,
    "phoneDigits" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "zip" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "accessToken" TEXT NOT NULL,
    "community" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "adultsInHome" INTEGER NOT NULL,
    "monthlyIncomeCents" INTEGER,
    "assistancePrograms" TEXT,
    "circumstances" TEXT NOT NULL,
    "churchHome" TEXT,
    "referredBy" TEXT,
    "agreedToTerms" BOOLEAN NOT NULL DEFAULT false,
    "adminNotes" TEXT,
    "decidedAt" TIMESTAMP(3),
    "listSubmittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Angel" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "ageAtSeason" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "shirtSize" TEXT,
    "pantsSize" TEXT,
    "shoeSize" TEXT,
    "interests" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Angel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishItem" (
    "id" TEXT NOT NULL,
    "angelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "details" TEXT,
    "url" TEXT,
    "estPriceCents" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ItemStatus" NOT NULL DEFAULT 'NEEDED',
    "sponsorshipId" TEXT,
    "ministryCostCents" INTEGER,
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WishItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "phone" TEXT,
    "organization" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsorship" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "angelId" TEXT NOT NULL,
    "type" "SponsorshipType" NOT NULL,
    "status" "SponsorshipStatus" NOT NULL DEFAULT 'COMMITTED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sponsorship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "sponsorId" TEXT,
    "donorName" TEXT NOT NULL,
    "donorEmail" TEXT,
    "amountCents" INTEGER NOT NULL,
    "method" "DonationMethod" NOT NULL,
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "stripeSessionId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InKindGift" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "sponsorId" TEXT,
    "donorName" TEXT NOT NULL,
    "donorEmail" TEXT,
    "source" "InKindSource" NOT NULL,
    "description" TEXT NOT NULL,
    "estValueCents" INTEGER,
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InKindGift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Season_year_key" ON "Season"("year");

-- CreateIndex
CREATE INDEX "Household_emailNormalized_idx" ON "Household"("emailNormalized");

-- CreateIndex
CREATE INDEX "Household_phoneDigits_idx" ON "Household"("phoneDigits");

-- CreateIndex
CREATE INDEX "Child_householdId_idx" ON "Child"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_accessToken_key" ON "Application"("accessToken");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Application_seasonId_householdId_key" ON "Application"("seasonId", "householdId");

-- CreateIndex
CREATE INDEX "Angel_applicationId_idx" ON "Angel"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Angel_seasonId_number_key" ON "Angel"("seasonId", "number");

-- CreateIndex
CREATE INDEX "WishItem_angelId_idx" ON "WishItem"("angelId");

-- CreateIndex
CREATE INDEX "WishItem_sponsorshipId_idx" ON "WishItem"("sponsorshipId");

-- CreateIndex
CREATE UNIQUE INDEX "Sponsor_emailNormalized_key" ON "Sponsor"("emailNormalized");

-- CreateIndex
CREATE INDEX "Sponsorship_seasonId_idx" ON "Sponsorship"("seasonId");

-- CreateIndex
CREATE INDEX "Sponsorship_sponsorId_idx" ON "Sponsorship"("sponsorId");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_stripeSessionId_key" ON "Donation"("stripeSessionId");

-- CreateIndex
CREATE INDEX "Donation_seasonId_status_idx" ON "Donation"("seasonId", "status");

-- CreateIndex
CREATE INDEX "InKindGift_seasonId_idx" ON "InKindGift"("seasonId");

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Angel" ADD CONSTRAINT "Angel_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Angel" ADD CONSTRAINT "Angel_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Angel" ADD CONSTRAINT "Angel_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishItem" ADD CONSTRAINT "WishItem_angelId_fkey" FOREIGN KEY ("angelId") REFERENCES "Angel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishItem" ADD CONSTRAINT "WishItem_sponsorshipId_fkey" FOREIGN KEY ("sponsorshipId") REFERENCES "Sponsorship"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsorship" ADD CONSTRAINT "Sponsorship_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsorship" ADD CONSTRAINT "Sponsorship_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsorship" ADD CONSTRAINT "Sponsorship_angelId_fkey" FOREIGN KEY ("angelId") REFERENCES "Angel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InKindGift" ADD CONSTRAINT "InKindGift_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InKindGift" ADD CONSTRAINT "InKindGift_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
