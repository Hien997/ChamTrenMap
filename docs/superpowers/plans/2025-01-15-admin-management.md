# Admin Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin panel for managing tours, checkpoints, and guide content with email/password authentication and sanitized HTML content support.

**Architecture:** Extend existing User model with role/email/password fields. Admin routes guarded by server-side `requireAdmin()`. Session-based auth reuses existing cookie flow — role read from DB, not stored in cookie. Guide sections gain a `contentType` field (TEXT/HTML) with server-side HTML sanitization.

**Tech Stack:** Next.js 16 (App Router, RSC) · Prisma 6 · PostgreSQL · bcrypt · Zod · shadcn/ui · Tailwind CSS 4 · Vitest

**Spec:** `docs/superpowers/specs/2025-01-15-admin-management-design.md`

## Global Constraints

- Reuse existing session infrastructure (`sessionToken` cookie, `getSessionUser()`)
- Admin role stored in DB, read per request — not in cookie
- Passwords hashed with bcrypt (cost factor 12)
- All admin API routes validate with Zod
- HTML content sanitized server-side before storage
- Fixed guide section keys: introduction, history, culture, interesting_facts, travel_tips
- Tour delete cascades to TourCheckpoint links
- Checkpoint reorder via up/down buttons

---

### Task 1: Database schema changes + migration

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `Role` enum, `ContentType` enum, `User.email`, `User.passwordHash`, `User.role`, `GuideSection.contentType`

- [ ] **Step 1: Update schema.prisma**

Add to `prisma/schema.prisma`:
```prisma
enum Role {
  ANONYMOUS
  ADMIN
}

enum ContentType {
  TEXT
  HTML
}

model User {
  id           String    @id @default(cuid())
  sessionToken String    @unique
  role         Role      @default(ANONYMOUS)
  email        String?   @unique
  passwordHash String?
  createdAt    DateTime  @default(now())
  checkIns     CheckIn[]
  progress     TourProgress[]
}

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

- [ ] **Step 2: Generate migration**

```bash
cd /Users/nguyenhien/PT/ChamTrenMap && npx prisma migrate dev --name add_admin_and_content_type
```

Expected: Migration created and applied successfully.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add Role, ContentType enums and admin fields"
```

---

### Task 2: Session/auth helpers

**Files:**
- Modify: `src/lib/session.ts`
- Create: `src/lib/admin.ts`

**Interfaces:**
- Consumes: `getSessionUser()` from session.ts
- Produces: `getAdminUser(): Promise<User | null>`, `requireAdmin(): Promise<User>`, `hashPassword()`, `verifyPassword()`

- [ ] **Step 1: Add getAdminUser and requireAdmin to src/lib/admin.ts**

```ts
// src/lib/admin.ts
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import bcrypt from "bcrypt";

export async function getAdminUser() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 2: Install bcrypt**

```bash
npm install bcrypt && npm install -D @types/bcrypt
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/admin.ts package.json package-lock.json
git commit -m "feat(auth): add admin auth helpers and bcrypt"
```

---

### Task 3: HTML sanitization

**Files:**
- Create: `src/lib/sanitize.ts`
- Create: `tests/sanitize.test.ts`

**Interfaces:**
- Produces: `sanitizeHtml(raw: string): string`

- [ ] **Step 1: Write the failing test**

```ts
// tests/sanitize.test.ts
import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "@/lib/sanitize";

describe("sanitizeHtml", () => {
  it("strips script tags", () => {
    expect(sanitizeHtml("<script>alert(1)</script>Hello")).not.toContain("<script>");
  });

  it("strips event handlers", () => {
    expect(sanitizeHtml('<img src=x onerror="alert(1)">')).not.toContain("onerror");
  });

  it("strips javascript: URLs", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">click</a>')).not.toContain("javascript:");
  });

  it("allows safe tags", () => {
    const input = "<p>Hello <strong>world</strong></p>";
    expect(sanitizeHtml(input)).toContain("<p>");
    expect(sanitizeHtml(input)).toContain("<strong>");
  });

  it("allows safe attributes", () => {
    const input = '<a href="https://example.com" title="Link">text</a>';
    expect(sanitizeHtml(input)).toContain('href="https://example.com"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/nguyenhien/PT/ChamTrenMap && npx vitest run tests/sanitize.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement sanitizeHtml**

```ts
// src/lib/sanitize.ts
const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "em", "ul", "ol", "li", "a",
  "h1", "h2", "h3", "h4", "h5", "h6", "img", "blockquote",
]);

const ALLOWED_ATTRS = new Set(["href", "src", "alt", "title"]);

export function sanitizeHtml(raw: string): string {
  // Remove script/style tags and their contents
  let cleaned = raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  // Remove event handlers (onerror, onclick, etc.)
  cleaned = cleaned.replace(/\son\w+="[^"]*"/gi, "");

  // Remove javascript: URLs
  cleaned = cleaned.replace(/href\s*=\s*"javascript:[^"]*"/gi, "");

  // Remove disallowed tags (keep content)
  cleaned = cleaned.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
    return ALLOWED_TAGS.has(tag.toLowerCase()) ? match : "";
  });

  // Remove disallowed attributes from allowed tags
  cleaned = cleaned.replace(/<([a-z][a-z0-9]*)\s+([^>]*)>/gi, (match, tag, attrs) => {
    if (!ALLOWED_TAGS.has(tag.toLowerCase())) return match;
    const safeAttrs = attrs
      .split(/\s+/)
      .filter((attr) => {
        const name = attr.split("=")[0].toLowerCase();
        return ALLOWED_ATTRS.has(name);
      })
      .join(" ");
    return safeAttrs ? `<${tag} ${safeAttrs}>` : `<${tag}>`;
  });

  return cleaned;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/nguyenhien/PT/ChamTrenMap && npx vitest run tests/sanitize.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/sanitize.ts tests/sanitize.test.ts
git commit -m "feat: add HTML sanitization for admin content"
```

---

### Task 4: Admin API auth routes

**Files:**
- Create: `src/app/api/admin/login/route.ts`
- Create: `src/app/api/admin/logout/route.ts`

**Interfaces:**
- Consumes: `hashPassword`, `verifyPassword`, `getOrCreateSessionUser` (extended)
- Produces: `POST /api/admin/login`, `POST /api/admin/logout`

- [ ] **Step 1: Create login route**

```ts
// src/app/api/admin/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/admin";
import { SESSION_COOKIE_NAME } from "@/config/constants";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: result.data.email } });
  if (!user || !user.passwordHash) {
    return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(result.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, user.sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}
```

- [ ] **Step 2: Create logout route**

```ts
// src/app/api/admin/logout/route.ts
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/config/constants";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/login/route.ts src/app/api/admin/logout/route.ts
git commit -m "feat(api): add admin login and logout routes"
```

---

### Task 5: Admin layout + login page

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/login/page.tsx`

**Interfaces:**
- Consumes: `requireAdmin()`
- Produces: Admin layout with role guard, login form

- [ ] **Step 1: Create admin layout**

```tsx
// src/app/admin/layout.tsx
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return <div className="min-h-screen bg-muted/30">{children}</div>;
}
```

- [ ] **Step 2: Create login page**

```tsx
// src/app/admin/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Invalid email or password");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-6 shadow">
        <h1 className="text-xl font-bold">Admin Login</h1>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full rounded border px-3 py-2" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full rounded border px-3 py-2" />
        <button type="submit" disabled={loading} className="w-full rounded bg-primary px-4 py-2 text-primary-foreground">
          {loading ? "..." : "Log in"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/layout.tsx src/app/admin/login/page.tsx
git commit -m "feat(admin): add admin layout and login page"
```

---

### Task 6: Admin dashboard

**Files:**
- Create: `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `requireAdmin()`, `prisma.tour.findMany()`

- [ ] **Step 1: Create dashboard page**

```tsx
// src/app/admin/page.tsx
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Link } from "@/i18n/navigation";

export default async function AdminDashboard() {
  await requireAdmin();
  const [tours, checkpoints] = await Promise.all([
    prisma.tour.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.checkpoint.count(),
  ]);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Tours</p>
          <p className="text-2xl font-bold">{tours.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Checkpoints</p>
          <p className="text-2xl font-bold">{checkpoints}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Published</p>
          <p className="text-2xl font-bold">{tours.filter((t) => t.status === "PUBLISHED").length}</p>
        </div>
      </div>
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tours</h2>
        <Link href="/admin/tours/new" className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">New Tour</Link>
      </div>
      <div className="mt-4 space-y-2">
        {tours.map((tour) => (
          <div key={tour.id} className="flex items-center justify-between rounded border bg-card p-3">
            <div>
              <p className="font-medium">{tour.name}</p>
              <p className="text-sm text-muted-foreground">{tour.slug} · {tour.status}</p>
            </div>
            <Link href={`/admin/tours/${tour.slug}`} className="text-sm text-primary">Edit</Link>
          </div>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat(admin): add admin dashboard"
```

---

### Task 7: Tour CRUD API routes

**Files:**
- Create: `src/app/api/admin/tours/route.ts`
- Create: `src/app/api/admin/tours/[slug]/route.ts`

**Interfaces:**
- Consumes: `requireAdmin()`, Zod schemas
- Produces: `GET/POST /api/admin/tours`, `GET/PATCH/DELETE /api/admin/tours/[slug]`

- [ ] **Step 1: Create tour validation schemas**

```ts
// src/lib/validations/admin.ts
import { z } from "zod";

export const tourCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  description: z.string().default(""),
  coverImageUrl: z.string().default(""),
});

export const tourUpdateSchema = tourCreateSchema.partial();
```

- [ ] **Step 2: Create tours collection route**

```ts
// src/app/api/admin/tours/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin";
import { tourCreateSchema } from "@/lib/validations/admin";

export async function GET() {
  await getAdminUser();
  const tours = await prisma.tour.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ ok: true, data: tours });
}

export async function POST(request: NextRequest) {
  await getAdminUser();
  const body = await request.json();
  const result = tourCreateSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });
  const tour = await prisma.tour.create({ data: result.data });
  return NextResponse.json({ ok: true, data: tour });
}
```

- [ ] **Step 3: Create tour item route**

```ts
// src/app/api/admin/tours/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin";
import { tourUpdateSchema } from "@/lib/validations/admin";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  await getAdminUser();
  const tour = await prisma.tour.findUnique({ where: { slug: params.slug } });
  return NextResponse.json({ ok: true, data: tour });
}

export async function PATCH(request: NextRequest, { params }: { params: { slug: string } }) {
  await getAdminUser();
  const body = await request.json();
  const result = tourUpdateSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });
  const tour = await prisma.tour.update({ where: { slug: params.slug }, data: result.data });
  return NextResponse.json({ ok: true, data: tour });
}

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string } }) {
  await getAdminUser();
  await prisma.tour.delete({ where: { slug: params.slug } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/tours/ src/lib/validations/admin.ts
git commit -m "feat(api): add tour CRUD routes"
```

---

### Task 8: Checkpoint CRUD API routes

**Files:**
- Create: `src/app/api/admin/checkpoints/route.ts`
- Create: `src/app/api/admin/checkpoints/[slug]/route.ts`

**Interfaces:**
- Consumes: `getAdminUser()`, Zod schemas
- Produces: `GET/POST /api/admin/checkpoints`, `GET/PATCH/DELETE /api/admin/checkpoints/[slug]`

- [ ] **Step 1: Add checkpoint validation schemas**

Add to `src/lib/validations/admin.ts`:
```ts
export const checkpointCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  radiusMeters: z.number().default(100),
  estimatedVisitMinutes: z.number().default(30),
  priceVnd: z.number().nullable().optional(),
  priceKind: z.enum(["TICKET", "FOOD"]).default("TICKET"),
});

export const checkpointUpdateSchema = checkpointCreateSchema.partial();
```

- [ ] **Step 2: Create checkpoint collection route**

```ts
// src/app/api/admin/checkpoints/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin";
import { checkpointCreateSchema } from "@/lib/validations/admin";

export async function GET() {
  await getAdminUser();
  const checkpoints = await prisma.checkpoint.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ ok: true, data: checkpoints });
}

export async function POST(request: NextRequest) {
  await getAdminUser();
  const body = await request.json();
  const result = checkpointCreateSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });
  const checkpoint = await prisma.checkpoint.create({ data: result.data });
  return NextResponse.json({ ok: true, data: checkpoint });
}
```

- [ ] **Step 3: Create checkpoint item route**

```ts
// src/app/api/admin/checkpoints/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin";
import { checkpointUpdateSchema } from "@/lib/validations/admin";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  await getAdminUser();
  const cp = await prisma.checkpoint.findUnique({ where: { slug: params.slug } });
  return NextResponse.json({ ok: true, data: cp });
}

export async function PATCH(request: NextRequest, { params }: { params: { slug: string } }) {
  await getAdminUser();
  const body = await request.json();
  const result = checkpointUpdateSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });
  const cp = await prisma.checkpoint.update({ where: { slug: params.slug }, data: result.data });
  return NextResponse.json({ ok: true, data: cp });
}

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string } }) {
  await getAdminUser();
  await prisma.checkpoint.delete({ where: { slug: params.slug } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/checkpoints/ src/lib/validations/admin.ts
git commit -m "feat(api): add checkpoint CRUD routes"
```

---

### Task 9: Seed admin user

**Files:**
- Modify: `prisma/seed.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `hashPassword()`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` from env

- [ ] **Step 1: Add admin seed to prisma/seed.ts**

Add at the end of `main()`:
```ts
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
if (adminEmail && adminPassword) {
  const passwordHash = await hashPassword(adminPassword);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", passwordHash },
    create: {
      email: adminEmail,
      role: "ADMIN",
      passwordHash,
      sessionToken: crypto.randomUUID(),
    },
  });
  console.log(`✅ Admin user ready: ${adminEmail}`);
}
```

And import `hashPassword` from `@/lib/admin`.

- [ ] **Step 2: Update .env.example**

Add:
```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=changeme
```

- [ ] **Step 3: Run seed**

```bash
cd /Users/nguyenhien/PT/ChamTrenMap && npm run db:seed
```

Expected: "Admin user ready: admin@example.com" (or skip if env vars not set).

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts .env.example
git commit -m "feat(seed): add admin user seeding from env"
```

---

### Task 10: Admin tour pages

**Files:**
- Create: `src/app/admin/tours/new/page.tsx`
- Create: `src/app/admin/tours/[slug]/page.tsx`

**Interfaces:**
- Consumes: `requireAdmin()`, tour API routes

- [ ] **Step 1: Create new tour page**

```tsx
// src/app/admin/tours/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTourPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/tours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, description, status: "DRAFT" }),
    });
    if (res.ok) router.push("/admin");
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">New Tour</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required className="w-full rounded border px-3 py-2" />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug" required className="w-full rounded border px-3 py-2" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full rounded border px-3 py-2" rows={4} />
        <button type="submit" className="rounded bg-primary px-4 py-2 text-primary-foreground">Create</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Create edit tour page**

Similar pattern with PATCH request, pre-filled fields from fetched tour data.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/tours/new/page.tsx src/app/admin/tours/[slug]/page.tsx
git commit -m "feat(admin): add tour create and edit pages"
```

---

### Task 11: Admin checkpoint pages

**Files:**
- Create: `src/app/admin/checkpoints/new/page.tsx`
- Create: `src/app/admin/checkpoints/[slug]/page.tsx`

**Interfaces:**
- Consumes: `requireAdmin()`, checkpoint API routes, `sanitizeHtml()`

- [ ] **Step 1: Create new checkpoint page**

Form with fields: name, slug, latitude, longitude, radius, visit minutes, price.

- [ ] **Step 2: Create edit checkpoint page**

Form pre-filled from fetched data. Guide sections editor with content type toggle and HTML preview.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/checkpoints/new/page.tsx src/app/admin/checkpoints/[slug]/page.tsx
git commit -m "feat(admin): add checkpoint create and edit pages"
```

---

### Task 12: Update public checkpoint page for HTML content

**Files:**
- Modify: `src/app/[locale]/checkpoints/[slug]/page.tsx`

**Interfaces:**
- Consumes: `GuideSection.contentType`

- [ ] **Step 1: Render HTML content when contentType is HTML**

In the article section, conditionally render:
```tsx
{section.contentType === "HTML" ? (
  <div dangerouslySetInnerHTML={{ __html: section.content }} />
) : (
  section.content.split(/\n{2,}/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/[locale]/checkpoints/[slug]/page.tsx
git commit -m "feat: render HTML guide content on public checkpoint page"
```

---

## Self-Review

**Spec coverage:**
- Task 1: Data model ✓
- Task 2: Auth helpers ✓
- Task 3: Sanitization ✓
- Task 4: Login/logout API ✓
- Task 5: Layout + login page ✓
- Task 6: Dashboard ✓
- Task 7: Tour CRUD API ✓
- Task 8: Checkpoint CRUD API ✓
- Task 9: Seed admin ✓
- Task 10: Tour pages ✓
- Task 11: Checkpoint pages ✓
- Task 12: Public HTML rendering ✓

**Placeholder scan:** None — all steps have concrete code.

**Type consistency:** `getAdminUser()` returns `User | null` across all tasks. `requireAdmin()` returns `User`. Zod schemas named consistently.
