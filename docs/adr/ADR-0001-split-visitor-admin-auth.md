# ADR-0001 — Split Visitor identity from Admin auth

- **Status:** Accepted · 2026-09-23
- **Source:** architecture review (candidate B, top recommendation); security findings S3, S6, S7, S9 in `docs/security-review.md`
- **Supersedes:** the dual-purpose design of `src/lib/session.ts` + `src/lib/admin.ts` (both deleted by this ADR)

## Context

One module (`session.ts`) minted anonymous visitor rows on every fresh cookie (unauthenticated DB write — S6) *and* carried the admin session (static, never-rotated, never-expiring token — S7). One cookie (`ctm_session`) served both identities; admin login clobbered visitor progress linkage. Login had no rate limit (S3), and `requireAdmin` redirected API callers to HTML instead of returning 401 (S9). Security policy (rotation, expiry, throttling) had no home.

## Decision

1. **Write-lazy visitor identity** — visitor cookie carries an ID; the `User` row is created only on the visitor's first check-in. S6 killed at the root.
2. **Admin token: rotate per login + absolute expiry** — each `POST /api/admin/login` issues a fresh 32-byte token; stored as `adminSessionTokenHash` (SHA-256) + `adminSessionExpiresAt` on `User` (single migration). Cookie gets matching `maxAge`. DB leak no longer yields usable tokens.
3. **Split cookies** — `ctm_visitor` owned by the visitor seam, `ctm_admin` by the admin seam. Logging out never touches visitor progress. Existing `ctm_session` holders become new visitors (session invalidation accepted).
4. **Login throttling** — `rateLimit("login:"+ip, { windowMs: 60_000, max: 5 })` via the existing in-memory limiter, extended with a lazy eviction sweep (addresses the unbounded-Map half of S5). Trusted-proxy assumption for `x-forwarded-for` documented.
5. **Two flat modules, deletions** — `src/lib/visitor-session.ts` + `src/lib/admin-auth.ts`; `session.ts` and `admin.ts` are deleted (bcrypt helpers fold into `admin-auth.ts`). Interfaces: `readVisitorId` / `ensureVisitor` (visitor) and `issueAdminSession` / `verifyAdminToken` / `requireAdminPage` / `requireAdminApi` / `revokeAdminSession` (admin). `requireAdminApi` returns 401 JSON — S9 fixed in the same pass.
6. **Test surface** — `tests/visitor-session.test.ts` + `tests/admin-auth.test.ts` in the existing mocked-prisma vitest style; no HTTP harness. Gate: `tsc --noEmit` + full `npm test` + `npm run build`.

## Consequences

- S3, S6, S7, S9 closed; S5 partially closed (eviction), spoofable-IP caveat remains and is documented.
- One Prisma migration (`User` columns); `prisma/seed.ts` no longer pre-bakes a session token.
- Existing admin sessions invalidate on deploy; each admin logs in once to get a rotating token.
- In-memory limiter remains per-instance — acceptable for single-node deploys; revisit with a shared store if the app fans out across serverless instances (would be a new ADR).
- Visitor `User` rows now represent only *check-in-owning* visitors; anything assuming row-per-cookie must migrate to `ensureVisitor` in the write path.
