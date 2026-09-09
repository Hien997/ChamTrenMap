# Plan.md — Chàm Trên Map (Hà Tiên Checkpoint Travel Platform)

## 1. Overview

A mobile-first tourism web app for Hà Tiên, Kiên Giang. Tourists follow the Hà Tiên Discovery tour on a Google Map, visit 8 checkpoints, read VN/EN online guides, check in via GPS (server-validated), track progress, and share their achievement via a public share page.

**Core loop:** Explore → Visit → Learn → Check In → Complete Tour → Share

**Phase 1 scope (approved):** Google Maps · Tours · Checkpoints · Online guides · GPS check-in · Progress · Share link · VN/EN i18n.
**Deferred to Phase 2:** audio guides, badges/XP, user profile, admin dashboard, PWA, analytics, generated share images (next/og). Database-driven content means admin CRUD can be added without schema changes.

## 2. Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| Project structure | Single Next.js app (Option A) | One deploy, shared TS types, fastest MVP; service layer keeps API extractable |
| Identity | Anonymous-first, httpOnly session cookie | Zero friction for tourists; upgrade path to accounts later |
| Hosting | Vercel + Neon Postgres | Free tiers, serverless-friendly |
| ORM | Prisma (stable 6.x line — `latest` tag currently points to an 8.0.0 RC) | Best DX, native Neon support |
| i18n | next-intl, locale prefix always (`/vi/...`, `/en/...`), default `vi` | Spec §32 |
| Map | `@vis.gl/react-google-maps` (official wrapper) + Maps JavaScript API + Directions API | Places/Geocoding deferred — data comes from our DB |
| Checkpoint ordering | Sequential: only the current checkpoint can be checked in; later ones locked | Spec §2 "unlock next checkpoint"; a free-roam mode is a future flag |
| XP/Badges | Excluded Phase 1; success UI shows checkpoint count (e.g. "3 / 8") instead of XP | Approved scope; schema leaves room |
| Demo images | picsum.photos seeded URLs in seed data | Stable placeholder URLs; clearly marked DEMO, replaceable |

## 3. Tech Stack

- Next.js **16.3.x** (App Router, TypeScript strict), Tailwind CSS **4.x**, shadcn/ui, **framer-motion 13**, **@tanstack/react-query 5**, **zustand 5**, **zod 4**
- **next-intl 4.x**, **@vis.gl/react-google-maps 1.10**, **Prisma 6.x + @prisma/client**, **nanoid** (share ids), **vitest** (unit tests)
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
