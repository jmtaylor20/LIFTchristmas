-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('PHOTO_ID', 'INCOME');

-- AlterTable
ALTER TABLE "Angel" ALTER COLUMN "gender" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "employer" TEXT,
ADD COLUMN     "importKey" TEXT,
ADD COLUMN     "jobLength" TEXT,
ADD COLUMN     "otherAgencyHelp" BOOLEAN,
ADD COLUMN     "priorHelp" BOOLEAN,
ADD COLUMN     "priorHelpYears" TEXT,
ADD COLUMN     "signatureName" TEXT,
ADD COLUMN     "signedAt" TIMESTAMP(3),
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'web',
ALTER COLUMN "adultsInHome" DROP NOT NULL,
ALTER COLUMN "circumstances" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "race" TEXT,
ALTER COLUMN "birthDate" DROP NOT NULL,
ALTER COLUMN "gender" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ApplicationDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "kind" "DocumentKind" NOT NULL,
    "data" BYTEA,
    "contentType" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationDocument_applicationId_idx" ON "ApplicationDocument"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_importKey_key" ON "Application"("importKey");

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

