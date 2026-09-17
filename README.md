# 🧭 Chắm Trên Map — Hà Tiên Checkpoint Travel Platform

**Your digital passport for discovering Hà Tiên.** Tourists follow the _Hà Tiên Discovery_ tour on an interactive map, visit 8 checkpoints, read VN/EN online guides, check in via server-validated GPS, track progress and share their achievement.

> Phase 1 MVP per `Plan.md` — interactive map · Tours · Checkpoints · Online guides · GPS check-in · Progress · Share links · VN/EN i18n, plus the Phase 2 admin CRUD. Remaining Phase 2 work (audio, badges/XP, PWA) is scaffolded for by the DB schema.

## Tech Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind CSS 4 · shadcn/ui · framer-motion · TanStack Query · Zustand · Zod · next-intl · MapLibre GL · OpenStreetMap tiles (no API key) · Prisma 6 · Neon Postgres · Vitest · Vercel

## Quick Start

```bash
npm install
cp .env.example .env        # then fill the values (see below)
npx prisma migrate deploy   # create tables from migration history
npm run db:seed             # DEMO seed: 1 tour + 8 checkpoints (vi + en)
npm run dev                 # http://localhost:3000 → redirects to /vi
```

Seed script registration (already set in `package.json`; re-add with
`npm pkg set prisma.seed="tsx prisma/seed.ts"` if missing), then run
`npx prisma db seed` or `npm run db:seed`.

### Environment variables (`.env`)

| Variable                          | Purpose                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| `DATABASE_URL`                    | Postgres connection string — Neon pooled URL in production, local Docker for dev      |
| `NEXT_PUBLIC_MAP_STYLE_URL`       | Optional. Empty = built-in OpenStreetMap tiles (keyless). Set a style URL to override |
| `NEXT_PUBLIC_MAP_LOAD_TIMEOUT_MS` | Optional. Time budget (ms) for one map-load attempt before the fallback kicks in      |
| `NEXT_PUBLIC_APP_URL`             | Canonical origin for share links & Open Graph (e.g. `https://yourdomain.vn`)          |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD`  | Initial admin account, created by the demo seed (`npm run db:seed`)                   |

### Map tiles (no API key)

The map uses **MapLibre GL** with a built-in **OpenStreetMap raster style** — no key,
no account, no watermark. Nothing to configure: leave `NEXT_PUBLIC_MAP_STYLE_URL`
empty and it works.

Two built-in styles and an automatic fallback keep the map usable on hostile
networks — verified on a Vietnamese ISP where `tile.openstreetmap.org` returns
**NXDOMAIN**:

1. **OSM raster** (`tile.openstreetmap.org`) loads first when no URL is configured.
2. The map rebuilds **once** on the **CARTO** raster style (same OpenStreetMap
   data, a different host/CDN) when either trigger fires:
   - **tiles fail** with none ever rendering (a blocked/NXDOMAIN tile host fails
     fast and silently — tile errors are non-fatal by design), or
   - a load attempt exceeds its **time budget** (`NEXT_PUBLIC_MAP_LOAD_TIMEOUT_MS`,
     default 20 s).
3. If the fallback also fails, a retry UI appears instead of an endless spinner.

Because OSM is unreachable on some networks, a first paint on CARTO after the
fallback is expected there — that is the fallback working, not a bug. See
[Map tiles](#map-tiles-no-api-key).

To use a different provider, set `NEXT_PUBLIC_MAP_STYLE_URL` to a style JSON,
e.g. a keyless vector style:

```bash
NEXT_PUBLIC_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
```

> **Before production:** OSM's free tiles are for low-volume use
> ([tile usage policy](https://operations.osmfoundation.org/policies/tiles/)) —
> community tile servers forbid bulk downloads. For real traffic, point
> `NEXT_PUBLIC_MAP_STYLE_URL` at a commercial provider or a self-hosted style.

### Database

- **Production:** create a project at [neon.tech](https://neon.tech) → copy the pooled connection string → `DATABASE_URL`.
- **Local dev (optional):** `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cham_tren_map postgres:16`

## Testing

```bash
npx vitest --run     # 61 tests: haversine, check-in policy, progress, tour-progress, checkpoint-content, i18n parity
npm run build        # typecheck + production build
```

Manual GPS testing: Chrome DevTools → Sensors → Location → _Custom location…_ set a checkpoint's coordinates to trigger a successful check-in; move the pin >100 m away to see the too-far flow.

## Architecture (see `Plan.md` for the full design)

```
src/app/[locale]/…      home · tours · map/[tourSlug] · checkpoints/[slug] · share/checkin/[shareId]
src/app/admin/…         login/logout + protected tours & checkpoints CRUD (incl. guides)
src/app/api/…           tours · tours/[slug] · tours/[slug]/progress · checkpoints/[slug]
                        checkins (POST, validated) · checkins/me · share/checkin
                        admin/checkpoints (auth-guarded CRUD) · admin/tours
src/services/…          business logic (tours, checkpoints, checkins, progress, share)
                        checkpoint-content* (admin checkpoint seam: schemas + read/write)
src/components/map/…    MapLibre kit (map · markers · utils) + domain consumers
src/lib/…               geo (haversine + policy), tour-progress, http, session
                        (anonymous cookie), rate-limit, api envelope, sanitize
prisma/…                schema (11 tables) + idempotent DEMO seed
```

**Check-in is server-authoritative:** the client only sends raw coordinates; the server computes Haversine distance, enforces the sequential checkpoint lock, GPS-accuracy policy, per-IP rate limiting and DB-level duplicate protection.

**i18n:** `/vi` (default) and `/en` routes via next-intl; UI strings in `src/messages/*.json`, content in per-locale DB tables with Vietnamese fallback.

**Maps:** MapLibre GL with OpenStreetMap tiles — keyless. See [Map tiles](#map-tiles-no-api-key).

**Seed data is DEMO:** approximate coordinates and placeholder photos — verify before production. Admin CRUD is available at `/admin`.

## Deploy (Vercel + Neon)

1. Push to GitHub → import the repo in Vercel.
2. Set the env vars above (`DATABASE_URL` from Neon + `NEXT_PUBLIC_APP_URL`). Map tiles need no key — see [Map tiles](#map-tiles-no-api-key).
3. Run once against the production DB: `npx prisma db push && npx prisma db seed`.
4. Verify: share-page OG preview (Facebook Sharing Debugger), map rendering, GPS check-in on a real device.

## Phase 2 Backlog

Audio guides · badges & XP · user profile · PWA · analytics · generated share images (next/og) · Upstash-backed rate limiting.
