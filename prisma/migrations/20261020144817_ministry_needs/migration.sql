-- AlterTable
ALTER TABLE "InKindGift" ADD COLUMN     "needItemId" TEXT,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "NeedItem" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "details" TEXT,
    "url" TEXT,
    "priceCents" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NeedItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NeedItem_seasonId_idx" ON "NeedItem"("seasonId");

-- CreateIndex
CREATE INDEX "InKindGift_needItemId_idx" ON "InKindGift"("needItemId");

-- AddForeignKey
ALTER TABLE "InKindGift" ADD CONSTRAINT "InKindGift_needItemId_fkey" FOREIGN KEY ("needItemId") REFERENCES "NeedItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedItem" ADD CONSTRAINT "NeedItem_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
