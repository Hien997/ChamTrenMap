# 🧭 Chắm Trên Map — Hà Tiên Checkpoint Travel Platform

**Your digital passport for discovering Hà Tiên.** Tourists follow the _Hà Tiên Discovery_ tour on a Google Map, visit 8 checkpoints, read VN/EN online guides, check in via server-validated GPS, track progress and share their achievement.

> Phase 1 MVP per `Plan.md` — Google Maps · Tours · Checkpoints · Online guides · GPS check-in · Progress · Share links · VN/EN i18n. Phase 2 (audio, badges/XP, admin, PWA) is scaffolded for by the DB schema.

## Tech Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind CSS 4 · shadcn/ui · framer-motion · TanStack Query · Zustand · Zod · next-intl · @vis.gl/react-google-maps · Prisma 6 · Neon Postgres · Vitest · Vercel

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

| Variable                          | Purpose                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `DATABASE_URL`                    | Postgres connection string — Neon pooled URL in production, local Docker for dev |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Key with **Maps JavaScript API** + **Directions API** enabled, domain-restricted |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`  | A **Vector Map ID** (required for AdvancedMarker status pins)                    |
| `NEXT_PUBLIC_APP_URL`             | Canonical origin for share links & Open Graph (e.g. `https://yourdomain.vn`)     |

### Google Maps setup

1. console.cloud.google.com → enable **Maps JavaScript API** and **Directions API**.
2. Create an **API key**; restrict it to your domains and to those two APIs.
3. **Map Management → Create Map ID** (type: Vector) → copy into `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`.

### Database

- **Production:** create a project at [neon.tech](https://neon.tech) → copy the pooled connection string → `DATABASE_URL`.
- **Local dev (optional):** `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cham_tren_map postgres:16`

## Testing

```bash
npx vitest run        # haversine, check-in policy, sequential status derivation (15 tests)
npm run build         # typecheck + production build
```

Manual GPS testing: Chrome DevTools → Sensors → Location → _Custom location…_ set a checkpoint's coordinates to trigger a successful check-in; move the pin >100 m away to see the too-far flow.

## Architecture (see `Plan.md` for the full design)

```
src/app/[locale]/…      home · tours · map/[tourSlug] · checkpoints/[slug] · share/checkin/[shareId]
src/app/api/…           tours · tours/[slug] · tours/[slug]/progress · checkpoints/[slug]
                        checkins (POST, validated) · checkins/me · share/checkin
src/services/…          business logic (tours, checkpoints, checkins, progress, share)
src/lib/…               geo (haversine + policy), session (anonymous cookie), rate-limit, api envelope
prisma/…                schema (11 tables) + idempotent DEMO seed
```

**Check-in is server-authoritative:** the client only sends raw coordinates; the server computes Haversine distance, enforces the sequential checkpoint lock, GPS-accuracy policy, per-IP rate limiting and DB-level duplicate protection.

**i18n:** `/vi` (default) and `/en` routes via next-intl; UI strings in `src/messages/*.json`, content in per-locale DB tables with Vietnamese fallback.

**Seed data is DEMO:** approximate coordinates and placeholder photos — verify before production (admin CRUD arrives in Phase 2).

## Deploy (Vercel + Neon)

1. Push to GitHub → import the repo in Vercel.
2. Set the four env vars above (Neon URL + Maps key + Map ID + app URL).
3. Run once against the production DB: `npx prisma db push && npx prisma db seed`.
4. Verify: share-page OG preview (Facebook Sharing Debugger), map rendering, GPS check-in on a real device.

## Phase 2 Backlog

Audio guides · badges & XP · user profile · admin dashboard (tours/checkpoints CRUD) · PWA · analytics · generated share images (next/og) · Upstash-backed rate limiting.
