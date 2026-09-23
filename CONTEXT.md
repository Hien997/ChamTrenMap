# CONTEXT.md — Domain Glossary

Domain language for **ChamTrenMap** (Chắm trên Map) — a self-guided tour & GPS check-in app for Hà Tiên, Vietnam. Terms here are the names to use in code, tests, docs, and architecture reviews. Keep entries short; update when the model shifts.

| Term | Meaning |
|------|---------|
| **Tour** | An ordered itinerary of Checkpoints, identified by `slug`, with a publish `status` (`PUBLISHED` / draft). The unit visitors browse and follow. |
| **Tour translation** | The vi/en content of a Tour (`name`, `tagline`, `description`, `coverImageUrl`). One row per locale. |
| **Checkpoint** | A physical stop with GPS coordinates, `slug`, price/opening metadata, images, and per-locale content. Part of exactly the Checkpoints referenced by Tours. |
| **Checkpoint translation** | The vi/en content of a Checkpoint (`name`, `summary`, `address`, …). |
| **Guide content** | Admin-authored HTML article per Checkpoint and locale — **single content document per locale**, sanitized (`sanitizeHtml`) on write, rendered by `GuideContentRenderer`. |
| **Check-in** | A visitor's recorded arrival at a Checkpoint. Server-validated against GPS policy; the atomic write of the app. |
| **GPS policy** | Server-side check-in rules: radius (default 100 m), max reported accuracy (100 m), sequential unlock ("locked"), rate limit 10/min/IP. Decided in `createCheckIn` — never trusted from the client. |
| **Tour progress** | Which Checkpoints a visitor has completed on a Tour; drives the unlock chain and progress UI. |
| **Share link** | Public, unguessable link (`nanoid(10)`) exposing one Check-in — owned by the visitor who created it. |
| **Locale** | Supported UI/content language: `vi` \| `en`, default `vi`. Mirrors `src/messages/*.json` and translation rows. |
| **Visitor session** | Anonymous, cookie-borne identity on `ctm_visitor` — the visitor seam (`src/lib/visitor-session.ts`) only **reads** the cookie; a `User` row is created lazily at the visitor's **first check-in** (write-lazy, ADR-0001). Owns Check-ins and Share links. |
| **Admin session** | Identity on `ctm_admin` after `/api/admin/login` — handled by `src/lib/admin-auth.ts`. Token **rotates on every login**, stored SHA-256-hashed with `adminSessionExpiresAt` on `User`. `requireAdminPage` redirects; `requireAdminApi` returns 401 JSON. Login is rate-limited (5/min/IP). |
| **API envelope** | One module, two shapes (`src/lib/api.ts`): public routes `{ ok: true, data }` / `{ ok: false, error: { code, message, details } }` via `apiOk`/`apiError`/`parseBody`; admin routes the flat adapter `adminOk`/`adminError`/`parseAdminBody` → `{ ok, ...entities }` / `{ ok, error: string, details? }`. Contract pinned by `tests/api-envelope.test.ts`. |
| **Map load escalation** | Basemap failure policy: on timeout or ≥3 tile errors with nothing rendered → switch to **fallback style** once → then **give up** (error card). Pure deciders in `map.utils.ts`. |
| **Fallback style** | The bundled OpenFreeMap Liberty style used when the default style/tiles stall. |
| **Form field** | `src/components/form` primitive (`InputField`, `SelectField`, …) wrapping label/hint/error around react-hook-form; error precedence is always `serverError ?? peekErrors(...)`. |

## Conventions worth stating

- Field names in forms are **strings** (`name: string`); error lookup walks dot-paths (`vi.name`) via `peekErrors`.
- "Error replaces hint": when a field errors, its hint paragraph is not shown.
- Content safety boundary: **guide HTML passes the `sanitizeHtml` seam** (now the `sanitize-html` parser) on write; translation name/summary fields don't need write-side sanitization because the JSON-LD script escapes `<` at render time (`serializeJsonLd`, S4).
- ADRs live in `docs/adr/` — `ADR-0001` records the visitor/admin auth split (accepted 2026-09-23). Rejections with load-bearing reasons get recorded there so future reviews don't re-suggest them.
