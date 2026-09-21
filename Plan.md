# Plan.md — Chắm Trên Map (Hà Tiên Checkpoint Travel Platform)

## 1. Overview

A mobile-first tourism web app for Hà Tiên, An Giang. Tourists follow the Hà Tiên Discovery tour on an interactive map (MapLibre GL + OpenStreetMap — see the revision note below), visit 8 checkpoints, read VN/EN online guides, check in via GPS (server-validated), track progress, and share their achievement via a public share page.

**Core loop:** Explore → Visit → Learn → Check In → Complete Tour → Share

**Phase 1 scope (approved):** ~~Google Maps~~ **MapLibre GL + OpenStreetMap tiles** · Tours · Checkpoints · Online guides · GPS check-in · Progress · Share link · VN/EN i18n.
**Deferred to Phase 2:** audio guides, badges/XP, user profile, admin dashboard, PWA, analytics, generated share images (next/og). Database-driven content means admin CRUD can be added without schema changes.

> **⚠️ Revision — map stack changed (implemented).** The map is **MapLibre GL + OpenStreetMap tiles**, not Google Maps: no API key, no billing account. Sections below that name Google Maps (`§1` scope, `§2` map row, `§3`, `§10`, `§12`) describe the *original* plan and are kept for the record; the shipped behaviour lives in `src/components/map/` and the README's *Map tiles* section. Key differences: a raster OSM style instead of the vector `<Map>`; custom marker DOM instead of `AdvancedMarker`; **OSRM** routing (`src/lib/routing.ts`, configurable base URL) instead of the Directions API; and a cross-host keyless fallback style (OSM → OpenFreeMap) instead of a Google key fallback. The "Open in Google Maps" *deep link* (`maps/dir/?api=1&…`) is retained — it's an outbound link, not the SDK. Admin CRUD (originally Phase 2) has also shipped.

## 2. Decisions Log

| Decision            | Choice                                                                                | Rationale                                                                     |
| ------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Project structure   | Single Next.js app (Option A)                                                         | One deploy, shared TS types, fastest MVP; service layer keeps API extractable |
| Identity            | Anonymous-first, httpOnly session cookie                                              | Zero friction for tourists; upgrade path to accounts later                    |
| Hosting             | Vercel + Neon Postgres                                                                | Free tiers, serverless-friendly                                               |
| ORM                 | Prisma (stable 6.x line — `latest` tag currently points to an 8.0.0 RC)               | Best DX, native Neon support                                                  |
| i18n                | next-intl, locale prefix always (`/vi/...`, `/en/...`), default `vi`                  | Spec §32                                                                      |
| Map                 | ~~`@vis.gl/react-google-maps` + Maps JS/Directions API~~ → **MapLibre GL + OpenStreetMap raster tiles, keyless** | **Revised:** zero-key setup (the Google plan needed a billing account); fallback host keeps VN ISPs that block `tile.openstreetmap.org` working |
| Checkpoint ordering | Sequential: only the current checkpoint can be checked in; later ones locked          | Spec §2 "unlock next checkpoint"; a free-roam mode is a future flag           |
| XP/Badges           | Excluded Phase 1; success UI shows checkpoint count (e.g. "3 / 8") instead of XP      | Approved scope; schema leaves room                                            |
| Demo images         | picsum.photos seeded URLs in seed data                                                | Stable placeholder URLs; clearly marked DEMO, replaceable                     |

## 3. Tech Stack

- Next.js **16.3.x** (App Router, TypeScript strict), Tailwind CSS **4.x**, shadcn/ui, **framer-motion 13**, **@tanstack/react-query 5**, **zustand 5**, **zod 4**
- **next-intl 4.x**, **maplibre-gl 6.x** (revised — see the note above), **Prisma 6.x + @prisma/client**, **nanoid** (share ids), **vitest** (unit tests)
- Node 20+, pnpm or npm

## 4. Project Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── page.tsx                    # Landing: hero + Hà Tiên intro + tour cards
│   │   ├── tours/page.tsx              # Tour listing
│   │   ├── tours/[slug]/page.tsx       # Tour detail + checkpoint list (status icons)
│   │   ├── map/[tourSlug]/page.tsx     # Full-screen map experience (primary UX)
│   │   ├── checkpoints/[slug]/page.tsx # Online guide page (SEO-rich)
│   │   ├── share/checkin/[shareId]/page.tsx  # Public share page (OG)
│   │   └── layout.tsx                  # <html lang> + providers
│   ├── api/
│   │   ├── tours/route.ts               # GET list
│   │   ├── tours/[slug]/route.ts        # GET detail (with checkpoints)
│   │   ├── tours/[slug]/progress/route.ts  # GET my progress (session)
│   │   ├── checkpoints/[slug]/route.ts  # GET full guide
│   │   ├── checkins/route.ts            # POST check-in (validated)
│   │   ├── checkins/me/route.ts         # GET my check-ins
│   │   └── share/checkin/route.ts       # POST create share link
│   ├── sitemap.ts, robots.ts, globals.css
│   └── layout.tsx (root)
├── components/
│   ├── map/        # HaTienMap, CheckpointMarkers, TourPolyline, UserLocationMarker, DirectionsControls
│   ├── checkpoint/ # CheckpointPreviewCard, CheckpointBottomSheet, GuideSections, Gallery, CheckInButton
│   ├── tour/       # TourCard, TourProgressPanel, CheckpointListRow
│   ├── checkin/    # CheckInFlow (permission explainer → GPS → API), SuccessModal, TooFarDialog
│   ├── sharing/    # ShareButtons (Facebook/Zalo/WebShare/Copy)
│   └── ui/         # shadcn components
├── lib/
│   ├── prisma.ts, geo.ts, session.ts, rate-limit.ts, api.ts (error envelope), utils.ts
│   └── validations/ # zod schemas
├── services/       # tours, checkpoints, checkins, progress, share  (pure business logic)
├── types/          # domain DTOs (CheckpointView, TourProgressView, etc.)
├── config/         # constants.ts (radius, accuracy threshold, cookie)
└── messages/ vi.json, en.json
prisma/ schema.prisma, seed.ts
```

## 5. Database Schema (Prisma)

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum TourStatus { DRAFT PUBLISHED }

model Tour {
  id           String      @id @default(cuid())
  slug         String      @unique
  status       TourStatus  @default(DRAFT)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  translations TourTranslation[]
  checkpoints  TourCheckpoint[]
  progress     TourProgress[]
}

model TourTranslation {
  id            String @id @default(cuid())
  tourId        String
  tour          Tour   @relation(fields: [tourId], references: [id], onDelete: Cascade)
  locale        String   // "vi" | "en"
  name          String
  tagline       String
  description   String
  coverImageUrl String
  @@unique([tourId, locale])
}

model Checkpoint {
  id                    String @id @default(cuid())
  slug                  String @unique
  latitude              Float
  longitude             Float
  radiusMeters          Int    @default(100)   // admin-configurable check-in radius
  estimatedVisitMinutes Int    @default(30)
  sortOrderHint         Int    @default(0)
  translations          CheckpointTranslation[]
  images                CheckpointImage[]
  guides                GuideSection[]
  tourLinks             TourCheckpoint[]
  checkIns              CheckIn[]
}

model CheckpointTranslation {
  id              String     @id @default(cuid())
  checkpointId    String
  checkpoint      Checkpoint @relation(fields: [checkpointId], references: [id], onDelete: Cascade)
  locale          String
  name            String
  summary         String    // short card / preview text
  address         String    // localized address
  openingHours    String?
  bestTimeToVisit String?
  @@unique([checkpointId, locale])
}

model GuideSection {
  id           String     @id @default(cuid())
  checkpointId String
  checkpoint   Checkpoint @relation(fields: [checkpointId], references: [id], onDelete: Cascade)
  locale       String
  sectionKey   String     // "introduction" | "history" | "culture" | "interesting_facts" | "travel_tips"
  title        String
  content      String     // markdown
  sortOrder    Int
  @@unique([checkpointId, locale, sectionKey])
}

model CheckpointImage {
  id           String     @id @default(cuid())
  checkpointId String
  checkpoint   Checkpoint @relation(fields: [checkpointId], references: [id], onDelete: Cascade)
  url          String
  alt          String?
  sortOrder    Int        @default(0)
  isThumbnail  Boolean    @default(false)
}

model TourCheckpoint {
  id           String     @id @default(cuid())
  tourId       String
  tour         Tour       @relation(fields: [tourId], references: [id], onDelete: Cascade)
  checkpointId String
  checkpoint   Checkpoint @relation(fields: [checkpointId], references: [id], onDelete: Cascade)
  order        Int
  @@unique([tourId, checkpointId])
  @@unique([tourId, order])
}

model User {
  id           String   @id @default(cuid())
  sessionToken String   @unique     // random 32-byte hex; the httpOnly cookie value
  createdAt    DateTime @default(now())
  checkIns     CheckIn[]
  progress     TourProgress[]
}

model TourProgress {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tourId      String
  tour        Tour      @relation(fields: [tourId], references: [id], onDelete: Cascade)
  startedAt   DateTime  @default(now())
  completedAt DateTime?
  @@unique([userId, tourId])
}

model CheckIn {
  id                     String     @id @default(cuid())
  userId                 String
  user                   User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  checkpointId           String
  checkpoint             Checkpoint @relation(fields: [checkpointId], references: [id], onDelete: Cascade)
  latitude               Float
  longitude              Float
  accuracy               Float
  distanceFromCheckpoint Float
  checkedInAt            DateTime   @default(now())
  shareLink              ShareLink?
  @@unique([userId, checkpointId])   // duplicate check-ins impossible at DB level
}

model ShareLink {
  id        String   @id                    // nanoid(10) — used in /share/checkin/{id}
  checkInId String   @unique
  checkIn   CheckIn  @relation(fields: [checkInId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

11 tables = spec §23 set minus `checkpoint_audio`, `badges`, `user_badges` (Phase 2). i18n content lives in `*Translation` / `GuideSection` tables keyed by locale with **vi fallback** at the service layer.

## 6. API Contracts

All responses use `{ ok: true, data }` or `{ ok: false, error: { code, message } }`. `locale` query param (`vi|en`), default `vi`.

| Method & Path                    | Auth    | Purpose                                                                |
| -------------------------------- | ------- | ---------------------------------------------------------------------- |
| `GET /api/tours`                 | —       | Published tours, localized                                             |
| `GET /api/tours/[slug]`          | —       | Tour + ordered checkpoints (id, slug, name, order, summary, thumbnail) |
| `GET /api/tours/[slug]/progress` | session | `TourProgressView` (below); creates session lazily                     |
| `GET /api/checkpoints/[slug]`    | —       | Full checkpoint: translations, guide sections, images, visit info      |
| `POST /api/checkins`             | session | GPS check-in — server-validated (§7)                                   |
| `GET /api/checkins/me`           | session | My check-ins                                                           |
| `POST /api/share/checkin`        | session | `{ checkInId }` → `{ url }` (owner verified)                           |

**POST /api/checkins** — request `{ checkpointId, latitude, longitude, accuracy }` (Zod-validated; accuracy optional). Server decides everything; response variants:

- `ok` → `{ checkIn, progress: TourProgressView }`
- `TOO_FAR` (422) → `{ distanceMeters, radiusMeters }`
- `POOR_ACCURACY` (422) → `{ accuracy, maxAccuracy }`
- `LOCKED` (422) → checkpoint is not the current one in tour order
- `ALREADY_CHECKED_IN` (409)
- `NOT_FOUND` (404), `RATE_LIMITED` (429)

```ts
interface TourProgressView {
  tourSlug: string;
  completedCount: number;
  totalCount: number;
  percent: number;
  isCompleted: boolean;
  currentCheckpointId?: string;
  checkpoints: {
    checkpointId: string;
    order: number;
    status: "completed" | "current" | "locked";
  }[];
}
```

## 7. Session & Security

- **Session:** `ctm_session` httpOnly cookie (random 32-byte hex = `User.sessionToken`), `secure` in prod, `sameSite=lax`, 365 days. Created lazily by `getOrCreateSessionUser()` in identity-needing routes — never a popup or login gate.
- **Check-in validation (server-only, spec §12/§30):** Zod parse → rate limit → resolve session → load checkpoint + tour ordering → sequential lock check → Haversine distance ≤ `radiusMeters` → `accuracy ≤ MAX_GPS_ACCURACY_METERS` → insert `CheckIn` (DB unique constraint blocks dupes) → upsert `TourProgress`, set `completedAt` when last checkpoint done.
- **Constants** (`src/config/constants.ts`): `DEFAULT_RADIUS_METERS = 100`, `MAX_GPS_ACCURACY_METERS = 100`, `CHECKIN_RATE_LIMIT = 10/min per IP` (in-memory limiter — documented serverless limitation, Upstash as future swap).
- Never trust client-sent distance/status/progress — all computed server-side.

## 8. Check-in Flow (UX)

1. User taps **Check In** (map bottom sheet or guide page).
2. If location permission missing → explainer dialog (spec §28: why we need location) → browser prompt on continue.
3. `getCurrentPosition({ enableHighAccuracy: true, timeout: 10_000 })` → `POST /api/checkins`.
4. Outcomes mapped to UI: **success modal** (framer-motion spring check mark, progress bar fill, count-up "3 / 8", subtle confetti built with framer-motion — no extra lib), **too-far dialog** ("You are 850 m away…"), **poor accuracy** message, **already checked in** → friendly notice, **locked** → "Complete the previous checkpoint first".
5. Success modal CTAs: **Continue Tour** (→ map, next checkpoint) · **Share** (creates share link, opens share sheet).

## 9. i18n Architecture (VN + EN)

- next-intl: `locales = ["vi", "en"]`, `defaultLocale = "vi"`, `localePrefix = "always"`; `/` redirects to `/vi`.
- UI strings: `src/messages/vi.json`, `en.json` (nav, buttons, dialogs, statuses, success/share copy).
- Content (names, summaries, guides, addresses): DB translation tables, fetched by locale with vi fallback; API accepts `?locale=`.
- SEO per locale: `generateMetadata({ params })`, canonical + `hreflang` alternates (`/vi/...` ↔ `/en/...`), `<html lang>` set in `[locale]/layout.tsx`.

## 10. Map & Markers

- **Shipped (revised):** full-screen MapLibre GL map (`src/components/map/MapLibreMap.tsx`) with a raster OpenStreetMap style — no `mapId`, no API key.
- Markers by status: ✅ completed · ⭐ current/available · 🔒 locked; click → bottom sheet preview card (spec §7 layout).
- Polyline connecting checkpoints in order; user location via `navigator.geolocation.watchPosition`.
- **Shipped (revised):** routing via OSRM (`src/lib/routing.ts`, `/route/v1/{profile}/…`) instead of `DirectionsService`/`DirectionsRenderer`, with the same **Walking/Driving** toggle, plus the retained "Open in Google Maps" deep link (`maps/dir/?api=1&destination=lat,lng&travelmode=`).
- Load robustness: a per-attempt time budget, plus tile-failure escalation, swaps in the keyless OpenFreeMap vector fallback style once before showing a retry UI.

## 11. Seed Data (DEMO — admin must verify before production)

Tour: **Hà Tiên Discovery** (`ha-tien-discovery`), published, ~4 h walking tour:

| #   | Checkpoint                 | slug             | Approx coords (DEMO) | Minutes |
| --- | -------------------------- | ---------------- | -------------------- | ------- |
| 1   | Mũi Nai                    | `mui-nai`        | 10.3899, 104.5072    | 45      |
| 2   | Thạch Động                 | `thach-dong`     | 10.3725, 104.4975    | 30      |
| 3   | Chùa Phù Dung              | `chua-phu-dung`  | 10.3845, 104.4810    | 30      |
| 4   | Lăng Mạc Cửu               | `lang-mac-cuu`   | 10.3858, 104.4822    | 30      |
| 5   | Đền thờ họ Mạc             | `den-tho-ho-mac` | 10.3838, 104.4833    | 20      |
| 6   | Chợ Hà Tiên (night market) | `cho-ha-tien`    | 10.3865, 104.4848    | 40      |
| 7   | Núi Đá Dựng                | `nui-da-dung`    | 10.3908, 104.4650    | 60      |

Each checkpoint: vi+en translations (name, summary, address, opening hours, best time), 5 guide sections (introduction/history/culture/interesting_facts/travel_tips) in vi+en with real content about Mạc Cửu history (Hà Tiên founded 1708, Hà Tiên thập vịnh, etc.), 3 demo images (`picsum.photos/seed/<slug>-n`), radius 100 m default. Seed marked `DEMO DATA`.

## 12. Environment (.env.example)

```env
DATABASE_URL=postgresql://...neon.../db?sslmode=require   # Neon pooled connection
NEXT_PUBLIC_MAP_STYLE_URL=                                # optional; empty = built-in OSM tiles (keyless)
NEXT_PUBLIC_MAP_LOAD_TIMEOUT_MS=                          # optional; default 20000
NEXT_PUBLIC_APP_URL=http://localhost:3000                 # canonical origin for share links & OG
```

*(Revised — the original plan listed `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` here; the keyless OSM setup replaced it.)*

## 13. Implementation Tasks (each = one commit)

- [x] **Task 0 — Scaffold:** `git init`, `create-next-app@latest` (App Router, TS, Tailwind 4, ESLint), tsconfig strict, shadcn init, install deps, verify `next dev`; initial commit.
- [x] **Task 1 — Prisma + Neon:** `schema.prisma` (§5), `prisma db push`, `lib/prisma.ts`, README DB section.
- [x] **Task 2 — Seed:** `prisma/seed.ts` per §11 → `prisma db seed`.
- [x] **Task 3 — Core libs:** `config/constants.ts`, `lib/geo.ts` (haversine + pure `evaluateCheckIn()` decision fn), `lib/session.ts`, `lib/rate-limit.ts`, `lib/api.ts` error envelope, `lib/validations/*`, domain types.
- [x] **Task 4 — Services + unit tests:** tours/checkpoints/checkins/progress/share services; **vitest** tests: haversine vs known distances, `evaluateCheckIn` all branches, status derivation (`completed/current/locked`). All green.
- [x] **Task 5 — API routes:** all §6 endpoints with Zod + session + rate limit; verified via curl.
- [x] **Task 6 — i18n:** next-intl routing/middleware/request config, vi+en message catalogs, `[locale]` layout, `/` → `/vi` redirect.
- [x] **Task 7 — UI shell + tours pages:** shadcn components, QueryProvider, landing, `/tours`, `/tours/[slug]` with live status via progress API.
- [x] **Task 8 — Map experience:** `/map/[tourSlug]` fullscreen, status markers, polyline, user location, bottom sheet (progress header, next checkpoint, preview card, Navigate w/ mode toggle), permission explainer.
- [x] **Task 9 — Guide page:** `/checkpoints/[slug]` SSR, guide sections, gallery, visit info, metadata (OG/Twitter/JSON-LD TouristAttraction/hreflang).
- [x] **Task 10 — Check-in UX:** `CheckInFlow` + `SuccessModal` + failure dialogs wired to API from map & guide pages.
- [x] **Task 11 — Share:** POST share API, `ShareButtons`, `/share/checkin/[shareId]` page + OG tags, share CTA from success modal.
- [x] **Task 12 — SEO sweep:** sitemap, robots, per-route metadata.
- [ ] **Task 13 — Polish & docs:** loading/error states, `.env.example`, README (Maps API setup, Neon, Vercel deploy), mobile QA checklist.

## 14. Testing Strategy

- **Unit (vitest):** haversine (Hà Tiên pairs, ±1 m), `evaluateCheckIn` (ok / too_far / poor_accuracy / locked / already), progress status derivation incl. tour completion.
- **Manual:** browser DevTools sensor override for GPS; real-device walking test; duplicate check-in → 409; locked checkpoint → 422; OG preview via Facebook Sharing Debugger + LinkedIn Post Inspector; Lighthouse mobile ≥ 90.

## 15. Deployment (production)

1. Neon: create project → copy pooled `DATABASE_URL` → `npx prisma db push && npx prisma db seed`.
2. ~~Google Cloud: enable **Maps JavaScript API** + **Directions API** → API key restricted to the production domain.~~ **Revised:** no map provider account needed — OSM tiles are keyless. (Optional: set `NEXT_PUBLIC_MAP_STYLE_URL` to a commercial/self-hosted style before real traffic.)
3. Vercel: import Git repo, set the env vars, deploy.
4. Verify share-page OG preview and map on production domain.
