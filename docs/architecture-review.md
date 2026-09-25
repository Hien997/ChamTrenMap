# Architecture Review — ChamTrenMap

> Scan pursuant to the *improve-codebase-architecture* skill: hot spots from git history, shallow modules, seam leaks, applied **deletion test**. Vocabulary: *module, interface, depth, seam, adapter, leverage, locality*. Domain names from `CONTEXT.md`.

- **Date:** 2026-09-23
- **Hot spots (git):** map stack (`map.utils.ts`, `MapLibreMap.tsx`, `MapExperience.tsx` — 8/8/7 commits), admin Checkpoint routes/forms (5–6 commits each), `checkpoints.service.ts`, guide editor.
- **Companion docs:** `docs/security-review.md` (findings feed candidates B and E).

## Candidates

### A. One API envelope module — `respond()` for every route — **Strong**
- **Files:** `src/lib/api.ts`, `src/lib/http.ts`, all 13 routes under `src/app/api/`.
- **Problem:** three interfaces for one concept — typed `apiOk/apiError` (public), raw `{ ok, error, details }` re-created ~20× (admin), `writeErrorResponse` (checkpoints only). Validation-error mapping (`issues.map(path/message)`) copy-pasted 4×. Zero *locality*: changing the error contract touches 13 files; each route re-implements an interface as complex as its own logic (shallow).
- **Solution:** one deep `respond` module: `apiOk`, `apiError`, `parseBody(schema)`, `parseLocale(searchParams)`; admin envelope becomes an adapter over it; delete `http.ts`.
- **Benefits/leverage:** deletion test passes — deleting the 20 inline blocks *concentrates* complexity in `lib/api.ts`. Test surface = the envelope: one test file pins the contract for **all** routes instead of none today.
- **Before/After:** 13 routes × 3 shapes → 13 routes × 1 deep module.
- **✅ Implemented (2026-09-23):** `respond` helpers live in `src/lib/api.ts` (`apiOk`/`apiError`/`parseBody`/`parseLocale` + the `adminOk`/`adminError`/`parseAdminBody`/`writeErrorResponse` adapter); `src/lib/http.ts` deleted; all 13 routes migrated; contract pinned by `tests/api-envelope.test.ts`.

### B. Split Visitor identity from Admin auth — two seams in `session.ts` — **Strong** ⭐ security
- **Files:** `src/lib/session.ts`, `src/lib/admin.ts`, `src/app/api/admin/login/route.ts`, `prisma/seed.ts`.
- **Problem:** one module does two jobs: mint anonymous Visitors (an **unauthenticated DB write** hidden inside `getOrCreateSessionUser`) and carry the Admin session (static token reuse). One cookie, two lifetimes; security policy (rotation, expiry, throttling) has no home — see findings S3, S6, S7. Interface shallow: callers can't tell "ensure identity" from "verify login".
- **Solution:** `visitor-session` seam (stateless or write-lazy identity) + `admin-auth` seam (per-login token, `expiresAt`, rate-limited). Cookie store = adapter behind each.
- **Benefits/locality:** rotation/expiry/throttle policy lives in exactly one module; fixes for S3/S6/S7 stop being cross-file surgery. The interface (issue session → validate session) becomes the test surface.
- **Deletion test:** deleting the dual-purpose `session.ts` concentrates auth complexity — yes.

### C. Map load state machine — one escalation module — **Worth exploring**
- **Files:** `src/components/map/map.utils.ts` (deciders exist), `MapLibreMap.tsx` (485 lines), `MapExperience.tsx` (421).
- **Problem:** pure decisions (`resolveMapTimeoutAction`, `resolveTileFailureAction`) were extracted, but the **orchestration** — who fires timeout vs style-error vs tile-error, when to `clearTimeout`, when to `setStatus("error")` — lives inline in the component. No *locality*: bugs hide in call order. Evidence: 5 consecutive fixes in this area (style errors → tile failover → load budget).
- **Solution:** one deep module: `reduce(state, event)` over `loading → fallback → give-up`, driven by maplibre events; component only renders `state`.
- **✅ Implemented (2026-09-23):** `map-load.ts` now owns the pure `reduce(state, event)` lifecycle (`loading → fallback → give-up`, plus retry); `MapLibreMap.tsx` only translates MapLibre events and renders the resulting state. The old deciders were deleted from `map.utils.ts`, and transition tests moved to `tests/map-error.test.ts`. Deletion test: removing the reducer puts the policy and call ordering back into the component — yes.

### D. Admin write service for Tours — parity with checkpoints — **Worth exploring**
- **Files:** `src/app/api/admin/tours/route.ts`, `…/tours/[slug]/route.ts`, vs `src/services/checkpoint-content.server.ts`.
- **Problem:** two adapters for the same concept "admin writes content": Checkpoints go through a tested service (`checkpoint-content.server`, 227 lines, test suite), **Tours talk to Prisma directly inside routes** — translation mapping duplicated between list GET and detail GET, no tests, replace-all stop rewrite logic buried at `tours/[slug]/route.ts:99-144`. Seam leaks: route = transport + persistence + mapping.
- **Solution:** `tours-admin.server` module mirroring `checkpoint-content.server`; routes shrink to parse → call → respond (via candidate A's envelope).
- **Benefits:** `admin create/update/delete` becomes the test surface (today: zero tour-write tests); parity guard like `4c7ce71` did for the guide editor.

### E. Sanitizer adapter — same interface, deeper implementation — **Strong** ⭐ security
- **Files:** `src/lib/sanitize.ts`, `src/components/guide/GuideContent.tsx`, `src/services/checkpoint-content.server.ts`, `tests/sanitize.test.ts`.
- **Problem:** interface `sanitizeHtml(raw): string` is right (good *seam*), but the regex implementation has grammar bypasses (S2: `/`-separated tags, single-quoted `javascript:`, unterminated tags). The module *looks* deep; its tests pass while XSS survives.
- **Solution:** keep the interface, swap the adapter (allowlist library), import the three PoC vectors as tests; optionally reuse the seam to sanitize translation `name`/`summary` (fixes S4's write-side).
- **Benefits:** the interface becomes the real test surface (XSS corpus), and S2+S4 collapse into one module change. **Dependency trade-off (new dep) → decide in grilling.**
- **✅ Implemented (2026-09-23):** interface kept, adapter swapped to `sanitize-html` (same allowed tags/attributes/schemes); the S2 PoC vectors imported as tests. S4 was fixed on the render side instead (`src/lib/jsonld.ts`), so write-side `name`/`summary` sanitization was deliberately **not** added — those fields render as plain text.

## Top recommendation

**B — Split Visitor identity from Admin auth.** It is the seam where the most load-bearing security findings converge (S3 login throttle, S6 session flood, S7 token rotation), the deletion test passes cleanly, and it turns scattered cross-file security patches into changes inside one deep module. E is the fastest security win if you want a quick pass first; A is the highest-leverage cleanup if security waits.

---
*HTML version (temp): `architecture-review-1790131071.html` in `$TMPDIR`.*
