# Guide Single-Content Design — 2026-09-15

## Overview
Collapse `GuideSection` from 5 fixed rows per locale (`introduction/history/culture/interesting_facts/travel_tips`) to **one HTML `content` row per locale**. `content` is the single source of truth; headings inside the HTML are structure, not DB fields.

## Goals
- One `content` field per `(checkpointId, locale)`.
- Remove `GUIDE_KEYS` and all `sectionKey` logic; no replacement hardcoded list.
- Reuse existing infrastructure: `sanitizeHtml`, Zod, PATCH deleteMany/createMany, public `dangerouslySetInnerHTML` renderer.
- No new editor library (none in `package.json`; constraint).

## Non-goals
- Rich-text toolbar/WYSIWYG (textarea + preview this round).
- Table rename (`GuideSection` kept) or folding into `CheckpointTranslation`.

## 1. Data model
```prisma
model GuideSection {
  id           String      @id @default(cuid())
  checkpointId String
  checkpoint   Checkpoint  @relation(fields: [checkpointId], references: [id], onDelete: Cascade)
  locale       String
  content      String
  contentType  ContentType @default(HTML)
  sortOrder    Int         @default(0)
  @@unique([checkpointId, locale])
}
```
Dropped: `sectionKey`, `title`. `contentType` always HTML going forward. `sortOrder` constant 0 to keep existing `orderBy` call sites working.

## 2. Migration + seed
New migration `XXXX_guide_single_content`:
1. Per `(checkpointId, locale)`, read old rows ordered by `sortOrder`, emit `<h2>{title}</h2>{body}` concatenated (TEXT bodies escaped in `<p>`, HTML bodies passed through `sanitizeHtml`).
2. Delete old rows, create merged rows.
3. Drop columns, replace unique index.
Seed: `SeedGuideSection.sectionKey/title` removed; per-locale `content` built with same `<h2>+body` template so fresh DBs match migrated DBs.

## 3. API / validation
- `guides[]` item: `{ id?, locale, content: min(1), contentType: literal HTML default HTML }`.
- POST/PATCH keep replace-all pattern keyed by locale; sanitize on write.
- GET returns `[{ id, locale, content, contentType }]`.

## 4. Types + service
- Delete `GuideSectionKey` (`src/types`, `CheckpointFormTypes`), `GUIDE_KEYS`, `TGuideSectionKey`.
- `GuideSectionView = { locale, content, contentType }`; `TGuide = { id?, locale, content, contentType }`.
- `getCheckpointDetail()` drops `bySectionKey` grouping; `pickLocalized` per locale retained.

## 5. Admin UI
- `GuideSectionEditor`: one `GuideSection` per locale tab; field `guide.<locale>.content` + hidden `contentType=HTML` + live preview.
- `GuideSection`: props `{ locale, existing? }`; remove title/select/sort inputs.
- `CheckpointEditForm.onSubmit`: read `guide.vi.content`/`guide.en.content`, skip-if-blank.

## 6. Rendering
New `src/components/guide/GuideContent.tsx` (`<GuideContentRenderer content>`): single sanitized HTML div. Used by public `[locale]/checkpoints/[slug]` page and admin preview. Null on empty.

## 7. Cleanup
Remove `GUIDE_KEYS`, `sectionKey`, old key strings from `src/`, seed, tests, translations. Docs noted historical.

## Testing
`npm run lint`, `npx vitest --run`, `rm -rf .next && npm run build`, live smoke admin-save → public render.
