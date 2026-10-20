-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('GIRL', 'BOY');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'WAITLIST', 'DENIED');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('NEEDED', 'CLAIMED', 'RECEIVED', 'MINISTRY');

-- CreateEnum
CREATE TYPE "SponsorshipType" AS ENUM ('FULL', 'PARTIAL');

-- CreateEnum
CREATE TYPE "GiftDelivery" AS ENUM ('DROP_OFF', 'SHIP');

-- CreateEnum
CREATE TYPE "SponsorshipStatus" AS ENUM ('COMMITTED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DonationMethod" AS ENUM ('VENMO', 'CASH', 'CHECK', 'OTHER');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'PAID', 'NOT_RECEIVED');

-- CreateEnum
CREATE TYPE "InKindSource" AS ENUM ('AMAZON_WISHLIST', 'DROP_OFF');

-- CreateEnum
CREATE TYPE "NoteStatus" AS ENUM ('PENDING', 'SENT', 'HELD');

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
    "venmoHandle" TEXT,
    "dropOffInstructions" TEXT,
    "shippingAddress" TEXT,
    "donationInstructions" TEXT,
    "pickupInstructions" TEXT,
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
    "language" TEXT NOT NULL DEFAULT 'en',
    "adminNotes" TEXT,
    "decidedAt" TIMESTAMP(3),
    "listSubmittedAt" TIMESTAMP(3),
    "listReminderSentAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
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
    "number" INTEGER,
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
CREATE TABLE "LoginToken" (
    "id" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GivingStatement" (
    "id" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "emailedTo" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sendCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "GivingStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsorship" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "angelId" TEXT NOT NULL,
    "type" "SponsorshipType" NOT NULL,
    "status" "SponsorshipStatus" NOT NULL DEFAULT 'COMMITTED',
    "delivery" "GiftDelivery" NOT NULL DEFAULT 'DROP_OFF',
    "trackingInfo" TEXT,
    "note" TEXT,
    "reminderSentAt" TIMESTAMP(3),
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
    "receivedAt" TIMESTAMP(3),
    "receiptSentAt" TIMESTAMP(3),
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

-- CreateTable
CREATE TABLE "ThankYouNote" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "angelId" TEXT,
    "message" TEXT NOT NULL,
    "imageData" BYTEA,
    "imageType" TEXT,
    "imageKey" TEXT,
    "status" "NoteStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThankYouNote_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "LoginToken_tokenHash_key" ON "LoginToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "GivingStatement_sponsorId_taxYear_key" ON "GivingStatement"("sponsorId", "taxYear");

-- CreateIndex
CREATE INDEX "Sponsorship_seasonId_idx" ON "Sponsorship"("seasonId");

-- CreateIndex
CREATE INDEX "Sponsorship_sponsorId_idx" ON "Sponsorship"("sponsorId");

-- CreateIndex
CREATE INDEX "Donation_seasonId_status_idx" ON "Donation"("seasonId", "status");

-- CreateIndex
CREATE INDEX "InKindGift_seasonId_idx" ON "InKindGift"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "ThankYouNote_imageKey_key" ON "ThankYouNote"("imageKey");

-- CreateIndex
CREATE INDEX "ThankYouNote_applicationId_idx" ON "ThankYouNote"("applicationId");

-- CreateIndex
CREATE INDEX "ThankYouNote_status_idx" ON "ThankYouNote"("status");

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
ALTER TABLE "LoginToken" ADD CONSTRAINT "LoginToken_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GivingStatement" ADD CONSTRAINT "GivingStatement_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "ThankYouNote" ADD CONSTRAINT "ThankYouNote_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThankYouNote" ADD CONSTRAINT "ThankYouNote_angelId_fkey" FOREIGN KEY ("angelId") REFERENCES "Angel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
