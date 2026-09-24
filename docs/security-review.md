# Security Review — ChamTrenMap

> **TL:DR** — 4 lỗ hổng cần xử lý sớm: dependency `maplibre-gl` (critical), sanitizer bypass (XSS), login không rate-limit, JSON-LD script breakout. Không phát hiện secret trong git, không SQL injection, mọi route admin đều có `requireAdmin`.
>
> **Cập nhật 2026-09-23:** S1–S9 đã xử lý xong (xem *Resolution log* dưới đây); còn sót S10 (chấp nhận theo thiết kế) và CSP (việc tiếp theo của S8).

- **Date:** 2026-09-23
- **Scope:** full repo (`src/`, `prisma/`, `tests/`, config) — manual review + pattern scan + `npm audit --omit=dev`
- **Method:** greps for XSS/SQLi/secrets/eval/auth patterns, line-by-line read of auth & content paths, dependency audit

## Findings

| ID | Severity | Title | Where |
|----|----------|-------|-------|
| S1 | 🔴 Critical | Vulnerable deps: `maplibre-gl` XSS advisory + Prisma chain | `package.json` |
| S2 | 🔴 High | `sanitizeHtml` regex bypasses → stored XSS | `src/lib/sanitize.ts` |
| S3 | 🔴 High | Login endpoint has no rate limit / lockout | `src/app/api/admin/login/route.ts` |
| S4 | 🟠 Med-High | JSON-LD `</script>` breakout (unescaped `<`) | `checkpoints/[slug]/page.tsx:282` |
| S5 | 🟡 Medium | In-memory rate limiter: spoofable IP, no eviction, per-instance | `src/lib/rate-limit.ts` |
| S6 | 🟡 Medium | Anonymous session → unauthenticated DB-row flood | `src/lib/session.ts:21-22` |
| S7 | 🟡 Medium | Static admin session token: no rotation, no expiry | `login/route.ts:36`, `prisma/seed.ts:151` |
| S8 | 🟡 Medium | No security headers (empty `next.config.ts`) | `next.config.ts:4` |
| S9 | 🟢 Low | `requireAdmin` redirects API callers (307) instead of 401 JSON | `src/lib/admin.ts:13` |
| S10 | 🟢 Low | Password policy = min length 1 | `src/lib/validations/admin.ts:39` |

### Resolution log

| ID | Status (2026-09-23) | How |
|----|---------------------|-----|
| S1 | ✅ Resolved | `maplibre-gl@6.11.0` (major bump — `tsc`/`build` clean, **manual map smoke still recommended**); `deepmerge-ts` forced to `^8.0.2` via npm `overrides` (prisma CLI verified with `validate` + `generate`). `npm audit --omit=dev`: **0 vulnerabilities**. |
| S2 | ✅ Resolved | Seam `sanitizeHtml(raw): string` kept, implementation swapped to the `sanitize-html` allowlist parser (architecture candidate E); the three PoC vectors added to `tests/sanitize.test.ts`. |
| S3 | ✅ Resolved (ADR-0001) | Per-IP limit on `POST /api/admin/login`; 429 + `Retry-After` before any parse/DB work. |
| S4 | ✅ Resolved | Render-side escaping via `serializeJsonLd()` (`<` → `\u003c`) in `src/lib/jsonld.ts`; breakout corpus in `tests/jsonld.test.ts`. |
| S5 | ✅ Resolved (ADR-0001) | Lazy eviction sweep in `rate-limit.ts`; first-`x-forwarded-for` trusted-proxy assumption documented (per-instance Map remains an accepted limitation until a shared store exists). |
| S6 | ✅ Resolved (ADR-0001) | Write-lazy visitor identity (`src/lib/visitor-session.ts`) — `User` rows only appear on first check-in, already rate-limited. |
| S7 | ✅ Resolved (ADR-0001) | Per-login rotating token, SHA-256 at rest, DB `expiresAt`, cookie `maxAge` (`src/lib/admin-auth.ts`). |
| S8 | 🟠 Partial | Baseline headers in `next.config.ts`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, prod-only HSTS. **CSP still open** — needs nonces via middleware plus a third-party origin pass (tiles/fonts). |
| S9 | ✅ Resolved (ADR-0001) | `requireAdminApi()` returns a 401 JSON envelope; pages keep redirecting. |
| S10 | ⚪ Open (accepted) | Password still `.min(1)` — value comes from the `ADMIN_PASSWORD` env today; revisit if self-service accounts are ever added. |

## Details

### S1 — Vulnerable dependencies (Critical)
`npm audit --omit=dev`: **4 vulnerabilities (3 high, 1 critical)**.
- **Critical:** `maplibre-gl <= 6.4.0` — GHSA-jrc7-96c5-q579 (XSS sanitizer bypass in `DOM.sanitize()`). Installed: `^5.24.0`. Fix: `maplibre-gl@6.11.0` (**breaking major** — map code uses it in 3 components + `map.utils.ts`).
- **High (×3):** `deepmerge-ts` ← `@prisma/config` ← `prisma` chain. Fix path pulls `prisma@6.12.0` (flagged breaking by npm).
- **Fix:** schedule a dedicated upgrade PR; run `npm test` + `npm run build` (108 tests) and the map smoke path after bumping. Do **not** blind-run `npm audit fix --force`.

### S2 — `sanitizeHtml` bypasses (High)
`sanitizeHtml` is the only defense for guide HTML rendered via `dangerouslySetInnerHTML` (`GuideContent.tsx:8`; written at `checkpoint-content.server.ts:134,207`). The regex implementation misses:
1. **Unquoted event handlers inside `/`-separated tags** — `<img/src=x onerror=alert(1)>`: handler strip (`sanitize.ts:27`) only matches double-quoted handlers; the tag-whitelist pass (`:30`) keeps allowed tags verbatim; the attr-rebuild pass (`:34`) requires whitespace after the tag name and never matches `<img/…>`. Payload survives.
2. **Single-quoted `javascript:` URLs** — `<a href='javascript:alert(1)'>` (`:28` matches only `"javascript:…"`); `href` is an allowed attr (`:20`), so it passes the attr filter.
3. **Unterminated tags** — `<img src=x onerror=alert(1)` (no closing `>`): every pass requires `>`; the browser parser auto-closes at block end.
- Existing tests (`tests/sanitize.test.ts`) only cover double-quoted variants.
- **Fix:** keep the `sanitizeHtml(raw): string` interface (it is a good seam) and swap the implementation for a maintained allowlist library (e.g. `sanitize-html` / isomorphic DOMPurify); add the three vectors above as tests. Dependency policy → decide in grilling.

### S3 — Login brute force (High)
`POST /api/admin/login` performs bcrypt compare with **no rate limiting** — `rateLimit()` exists (`src/lib/rate-limit.ts`) but is imported only by `POST /api/checkins`. Unlimited credential guessing; bcrypt cost 12 slows but does not stop distributed attempts. **Fix:** `rateLimit(\`login:${ip}\`, { windowMs: 60_000, max: 5 })` + generic 401, optionally exponential backoff per email.

### S4 — JSON-LD script breakout (Med-High)
`checkpoints/[slug]/page.tsx:282` renders `JSON.stringify(jsonLd)` inside `<script>`. `JSON.stringify` does **not** escape `<`. `jsonLd` (`:93-108`) embeds `checkpoint.name` / `summary` / `address` — admin-entered fields that do **not** pass through `sanitizeHtml` (only `guides[].content` does). A value like `</script><img src=x onerror=alert(1)>` closes the script block → stored XSS for every visitor of the checkpoint page. **Fix:** `JSON.stringify(jsonLd).replace(/</g, "\\u003c")` (and/or sanitize name fields at write time).

### S5 — Rate limiter weaknesses (Medium)
- Process-local `Map` (`rate-limit.ts:6`): resets per serverless instance — no shared accounting; trivially bypassed across instances.
- **No eviction**: expired buckets for never-seen-again keys accumulate → memory growth under many-IP load (self-DoS).
- Key = first `x-forwarded-for` hop (`checkins/route.ts:11-12`): spoofable unless behind a trusted proxy that overwrites the header.
- **Fix:** lazy eviction sweep on access + document trusted-proxy assumption; move login (S3) onto it.

### S6 — Anonymous session flood (Medium)
`getOrCreateSessionUser` (`session.ts:21-22`) **creates a `User` row** for any request bearing a fresh/unknown cookie, and is called unauthenticated by `GET /api/checkins/me`, `POST /api/checkins`, `POST /api/share/checkin`. Rotating cookies → unbounded `User` table growth. **Fix:** rate-limit session creation, or make visitor identity stateless (signed cookie) / create rows lazily on first check-in only.

### S7 — Static admin session token (Medium)
Admin login sets the **DB-stored, never-rotated** `user.sessionToken` (`login/route.ts:36`), seeded once (`seed.ts:151`, `crypto.randomUUID()`): no rotation on login, no server-side expiry column → a leaked token is a permanent session; DB read = session hijack. Also inconsistent lifetimes: login cookie has **no `maxAge`** (session cookie) while the anonymous cookie lasts 365 days (`constants.ts:8`). **Fix:** per-login token generation + `expiresAt`, or hash tokens at rest; unify cookie attributes (add `maxAge`).

### S8 — No security headers (Medium)
`next.config.ts` is empty (`const nextConfig: NextConfig = {}`): no `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`. CSP is the natural backstop for S2/S4. **Fix:** `headers()` in `next.config.ts`; start with `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, then iterate a CSP.

### S9 — API auth contract (Low)
Every admin API route calls `requireAdmin()`, which `redirect()`s (`admin.ts:13`) → unauthenticated `fetch` gets **307 → login HTML**, not `401 { error: UNAUTHORIZED }`. Clients cannot distinguish auth failure from a parse error. **Fix:** `requireAdminApi()` returning 401 for route handlers; keep `redirect` for pages/layout.

### S10 — Password policy (Low)
`loginSchema.password` is `.min(1)` (`validations/admin.ts:39`). Password comes from `ADMIN_PASSWORD` env today; policy matters if self-service is ever added. **Fix:** `.min(12)` at seed/change time.

## Positive controls (verified)

- ✅ `.env` never tracked (`.gitignore:36` + `!.env.example`); no `.env*` in git history.
- ✅ Cookies: `httpOnly` + `sameSite=lax` + `secure` (prod) on both set sites; logout is POST (CSRF-resistant under Lax).
- ✅ bcrypt cost 12 for hashing & verify (`admin.ts:18,22`).
- ✅ **All** admin routes call `requireAdmin()`; protected layout re-checks.
- ✅ Every request body/query validated with Zod `safeParse`/`parse` at the route boundary.
- ✅ Prisma Client only — **no** `$queryRaw`/`$executeRaw`/string-built SQL in `src/` → no SQLi surface.
- ✅ No `eval` / `new Function` / `child_process` anywhere.
- ✅ `handleApiError` logs server-side and returns generic `INTERNAL` (`api.ts:31-34`) — no stack leakage.
- ✅ Share IDs: `nanoid(10)` ≈ 60 bits, adequate for non-secret links.
- ✅ Map marker `innerHTML` uses only static constant strings (`marker-elements.ts`).
