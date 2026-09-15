-- DropIndex
DROP INDEX "GuideSection_checkpointId_locale_sectionKey_key";

-- AlterTable
ALTER TABLE "GuideSection" DROP COLUMN "sectionKey",
DROP COLUMN "title",
ALTER COLUMN "contentType" SET DEFAULT 'HTML',
ALTER COLUMN "sortOrder" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "GuideSection_checkpointId_locale_key" ON "GuideSection"("checkpointId", "locale");

