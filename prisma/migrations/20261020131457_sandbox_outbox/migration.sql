-- CreateTable
CREATE TABLE "SandboxEmail" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SandboxEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SandboxEmail_createdAt_idx" ON "SandboxEmail"("createdAt");
