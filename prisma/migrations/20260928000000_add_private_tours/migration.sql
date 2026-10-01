-- CreateEnum
CREATE TYPE "PrivateTourStatus" AS ENUM ('DRAFT', 'ACTIVE', 'REVOKED');

-- CreateTable
CREATE TABLE "PrivateTour" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerName" TEXT,
    "status" "PrivateTourStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "maxSlots" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateTour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateTourTranslation" (
    "id" TEXT NOT NULL,
    "privateTourId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverImageUrl" TEXT NOT NULL,

    CONSTRAINT "PrivateTourTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateTourStop" (
    "id" TEXT NOT NULL,
    "privateTourId" TEXT NOT NULL,
    "checkpointId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "PrivateTourStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateTourAccess" (
    "id" TEXT NOT NULL,
    "privateTourId" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "firstAccessAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivateTourAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateTourVisit" (
    "id" TEXT NOT NULL,
    "privateTourId" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "checkpointId" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivateTourVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrivateTour_code_key" ON "PrivateTour"("code");

-- CreateIndex
CREATE INDEX "PrivateTour_status_idx" ON "PrivateTour"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateTourTranslation_privateTourId_locale_key" ON "PrivateTourTranslation"("privateTourId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateTourStop_privateTourId_checkpointId_key" ON "PrivateTourStop"("privateTourId", "checkpointId");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateTourStop_privateTourId_order_key" ON "PrivateTourStop"("privateTourId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateTourAccess_privateTourId_sessionKey_key" ON "PrivateTourAccess"("privateTourId", "sessionKey");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateTourVisit_privateTourId_sessionKey_checkpointId_key" ON "PrivateTourVisit"("privateTourId", "sessionKey", "checkpointId");

-- AddForeignKey
ALTER TABLE "PrivateTourTranslation" ADD CONSTRAINT "PrivateTourTranslation_privateTourId_fkey" FOREIGN KEY ("privateTourId") REFERENCES "PrivateTour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateTourStop" ADD CONSTRAINT "PrivateTourStop_privateTourId_fkey" FOREIGN KEY ("privateTourId") REFERENCES "PrivateTour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateTourStop" ADD CONSTRAINT "PrivateTourStop_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "Checkpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateTourAccess" ADD CONSTRAINT "PrivateTourAccess_privateTourId_fkey" FOREIGN KEY ("privateTourId") REFERENCES "PrivateTour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateTourVisit" ADD CONSTRAINT "PrivateTourVisit_privateTourId_fkey" FOREIGN KEY ("privateTourId") REFERENCES "PrivateTour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

