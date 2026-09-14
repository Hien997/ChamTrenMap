# Admin Management for Tours and Checkpoints

## Overview

Add an admin panel for managing tours, checkpoints, and guide content. Only authenticated admins can access admin features. Guide sections support dynamic HTML content (sanitized) alongside plain text.

## Goals

- Full CRUD for tours (create, list, edit, delete, publish/unpublish)
- Full CRUD for checkpoints (create, list, edit, delete, reorder)
- Guide content editing with HTML support and sanitization
- Admin-only access with email/password authentication
- Reuse existing session infrastructure
- Extensible to multiple admins/roles in future

## Non-Goals

- Rich text editor (TipTap/Slate) — raw HTML textarea only for now
- Multiple admin roles — ANONYMOUS + ADMIN only
- Audit logging of admin actions
- Bulk import/export

## Data Model

### New enums

```prisma
enum Role {
  ANONYMOUS
  ADMIN
}

enum ContentType {
  TEXT
  HTML
}
```

### User model changes

```prisma
model User {
  id           String    @id @default(cuid())
  sessionToken String    @unique
  role         Role      @default(ANONYMOUS)
  email        String?   @unique  // null for anonymous users
  passwordHash String?             // null for anonymous users
  createdAt    DateTime  @default(now())
  checkIns     CheckIn[]
  progress     TourProgress[]
}
```

### GuideSection model changes

```prisma
model GuideSection {
  id           String      @id @default(cuid())
  checkpointId String
  checkpoint   Checkpoint  @relation(fields: [checkpointId], references: [id], onDelete: Cascade)
  locale       String
  sectionKey   String
  title        String
  content      String
  contentType  ContentType @default(TEXT)
  sortOrder    Int

  @@unique([checkpointId, locale, sectionKey])
}
```

## Authentication

### Login flow

1. Admin visits `/admin/login`
2. Submits email + password
3. Server looks up `User` by email, verifies `passwordHash` with bcrypt
4. On success: set session cookie (existing `sessionToken` flow, unchanged) — `role` is read from the DB on each request
5. Redirect to `/admin`

### Session extension

No cookie format change. The existing session cookie stores `sessionToken`. The `role` column is read from the DB on each authenticated request. The existing `getSessionUser()` function gains a sibling `getAdminUser()` that returns the full `User` when `role === "ADMIN"`, or null otherwise.

### Password storage

- Initial admin: credentials from `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`)
- Seed script hashes password with bcrypt (cost factor 12) and creates `User` with `role: ADMIN`
- If `ADMIN_EMAIL` already exists as an anonymous user, the seed promotes it to ADMIN and sets the password hash
- Never store plaintext passwords

### Logout

`POST /api/admin/logout` clears the session cookie.

## Authorization

### `requireAdmin()` helper

```ts
// src/lib/admin.ts
export async function requireAdmin(): Promise<User> {
  const user = await getAdminUser();  // returns User with role ADMIN, or null
  if (!user) {
    redirect("/admin/login");
  }
  return user;
}
```

- Used in all `/admin/*` Server Components
- API routes return 403 if not admin
- `getAdminUser()` reuses existing session lookup, adds `role === "ADMIN"` check

## Routes

### Public

| Route | Purpose |
|-------|---------|
| `/admin/login` | Login form |

### Admin (protected)

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard: tour list + stats |
| `/admin/tours/new` | Create tour form |
| `/admin/tours/[slug]` | Edit tour, manage checkpoints |
| `/admin/checkpoints/new` | Create checkpoint form |
| `/admin/checkpoints/[slug]` | Edit checkpoint + guide sections |

### API

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/admin/login` | Authenticate admin |
| POST | `/api/admin/logout` | Clear session |
| GET | `/api/admin/tours` | List all tours |
| POST | `/api/admin/tours` | Create tour (Zod validated) |
| GET | `/api/admin/tours/[slug]` | Get tour detail |
| PATCH | `/api/admin/tours/[slug]` | Update tour (Zod validated) |
| DELETE | `/api/admin/tours/[slug]` | Delete tour (cascades to TourCheckpoint) |
| GET | `/api/admin/checkpoints` | List all checkpoints |
| POST | `/api/admin/checkpoints` | Create checkpoint (Zod validated) |
| GET | `/api/admin/checkpoints/[slug]` | Get checkpoint detail |
| PATCH | `/api/admin/checkpoints/[slug]` | Update checkpoint (Zod validated) |
| DELETE | `/api/admin/checkpoints/[slug]` | Delete checkpoint |

## UI Design

### Login page

- Clean centered card
- Email + password fields
- Inline error message on failure
- Link back to public site

### Dashboard

- Stats cards: total tours, total checkpoints, published tours
- Tour list with actions (edit, delete, publish/unpublish)
- "New tour" button

### Tour edit

- Form: name, slug, status, description, cover image URL
- Inline validation errors on blur/submit
- Checkpoint manager: list, add, remove, reorder (up/down buttons)
- Delete with confirmation dialog

### Checkpoint edit

- Form: name, slug, coordinates, radius, visit minutes, price
- Inline validation errors on blur/submit
- Guide sections editor: per-locale, per-key
  - Section keys are fixed: introduction, history, culture, interesting_facts, travel_tips (matching existing `GuideSectionKey` type)
  - Admins edit content for existing keys only — no add/delete keys
- Content type toggle (text / HTML)
- HTML textarea with live preview (sanitized)
- Delete with confirmation dialog

## HTML Sanitization

### `src/lib/sanitize.ts`

```ts
export function sanitizeHtml(raw: string): string {
  // Strip script tags, event handlers, javascript: URLs
  // Allow safe tags: p, br, strong, em, ul, ol, li, a, h1-h6, img, blockquote
  // Allow safe attributes: href, src, alt, title
}
```

- Applied on save (server-side) before storage
- Client-side preview uses `dangerouslySetInnerHTML` with sanitized content
- Existing TEXT content rendered as plain text (unchanged behavior)

## Files

### New files

- `src/lib/admin.ts` — `requireAdmin()`, `getAdminUser()`, `hashPassword()`, `verifyPassword()`
- `src/lib/sanitize.ts` — HTML sanitization
- `src/lib/validations/admin.ts` — Zod schemas for admin API routes
- `src/app/admin/layout.tsx` — admin layout with role guard
- `src/app/admin/login/page.tsx`
- `src/app/admin/page.tsx` — dashboard
- `src/app/admin/tours/new/page.tsx`
- `src/app/admin/tours/[slug]/page.tsx`
- `src/app/admin/checkpoints/new/page.tsx`
- `src/app/admin/checkpoints/[slug]/page.tsx`
- `src/app/api/admin/login/route.ts`
- `src/app/api/admin/logout/route.ts`
- `src/app/api/admin/tours/route.ts`
- `src/app/api/admin/tours/[slug]/route.ts`
- `src/app/api/admin/checkpoints/route.ts`
- `src/app/api/admin/checkpoints/[slug]/route.ts`

### Modified files

- `prisma/schema.prisma` — new enums, `User.email`, `User.passwordHash`, `GuideSection.contentType`
- `prisma/seed.ts` — create/promote admin user from `.env`
- `.env.example` — add `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `src/lib/session.ts` — add `getAdminUser()` (reuses existing session lookup)

### Migration

- Add `Role` enum
- Add `User.role` (default ANONYMOUS)
- Add `User.email` (nullable, unique)
- Add `User.passwordHash` (nullable)
- Add `ContentType` enum
- Add `GuideSection.contentType` (default TEXT)

## Testing

- Unit: `sanitizeHtml()` — strips scripts, allows safe HTML
- Unit: `hashPassword()` / `verifyPassword()` — bcrypt round-trip
- Integration: admin API routes — auth required, CRUD works, Zod validation rejects bad input
- Manual: login flow, tour CRUD, checkpoint CRUD, HTML content preview, reorder up/down

## Security

- Passwords hashed with bcrypt (cost factor 12)
- Session cookies httpOnly, sameSite=lax, secure in production
- HTML sanitized before storage and render
- Admin routes guarded server-side
- CSRF: sameSite=lax cookie + origin check on state-changing routes
- Rate limiting on login (reuse existing in-memory limiter)
- Zod validation on all API input

## Migration plan

1. Add new fields to schema (nullable where possible)
2. Generate migration: `npx prisma migrate dev --name add_admin_and_content_type`
3. Backfill: existing users get `role = ANONYMOUS`, `email = null`, `passwordHash = null`
4. Seed admin user from `.env` (upsert by email)
5. Deploy
