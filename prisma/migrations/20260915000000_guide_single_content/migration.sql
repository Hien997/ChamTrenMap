-- Consolidate the legacy sectioned rows before enforcing one row per locale.
-- The new application stores one sanitized HTML document per checkpoint/locale.
-- Keep every legacy section, ordered by sortOrder (with deterministic tie-breakers).
WITH consolidated AS (
  SELECT
    "checkpointId",
    locale,
    MIN(id) AS id,
    string_agg(
      '<h2>' || title || '</h2><p>' || content || '</p>',
      '' ORDER BY "sortOrder", "sectionKey", id
    ) AS content
  FROM "GuideSection"
  GROUP BY "checkpointId", locale
)
UPDATE "GuideSection" AS guide
SET
  "content" = consolidated.content,
  "contentType" = 'HTML',
  "sortOrder" = 0
FROM consolidated
WHERE guide.id = consolidated.id;

-- Remove the other legacy rows only after the consolidated content is written.
DELETE FROM "GuideSection" AS guide
USING (
  SELECT "checkpointId", locale, MIN(id) AS keep_id
  FROM "GuideSection"
  GROUP BY "checkpointId", locale
) AS keepers
WHERE guide."checkpointId" = keepers."checkpointId"
  AND guide.locale = keepers.locale
  AND guide.id <> keepers.keep_id;

-- DropIndex
DROP INDEX "GuideSection_checkpointId_locale_sectionKey_key";

-- AlterTable
ALTER TABLE "GuideSection" DROP COLUMN "sectionKey",
DROP COLUMN "title",
ALTER COLUMN "contentType" SET DEFAULT 'HTML',
ALTER COLUMN "sortOrder" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "GuideSection_checkpointId_locale_key" ON "GuideSection"("checkpointId", locale);

