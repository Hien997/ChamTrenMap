# ADR-0003 — Offset pagination and server search for admin lists

- **Status:** Accepted (recorded retroactively) · 2026-09-23
- **Source:** feature commit `c247bfa`; `src/hooks/usePaginatedAdminList.ts`, `src/services/search.ts`, `adminListQuerySchema`
- **Related:** `CONTEXT.md` (API envelope, Admin list query) · `docs/logic-map.md` §6.2

## Context

The admin tour/checkpoint lists fetched **every row on every visit** and filtered nothing. As the catalog grows, that is slow to load and impossible to scan. Options considered: client-side filtering over the full payload (still downloads everything), keyset/cursor pagination (no total count, so infinite scroll cannot know whether more rows exist), and offset pagination with a server-computed total.

## Decision

Server-side offset paging + search — `GET /api/admin/*?q=&take=&offset=` → `{ ok, items, total }`:

- **`q`** (trimmed, ≤ 100 chars) builds a case-insensitive `contains` OR-match over **slug or any translation's name** via the pure builders `buildTourSearchWhere` / `buildCheckpointSearchWhere` (`src/services/search.ts`). Empty `q` = no filter.
- **`take`** defaults to 10, hard-capped at 50; **`offset`** ≥ 0. All three arrive as strings from `URLSearchParams` and are coerced/bounded by `adminListQuerySchema` *before* any query runs.
- **Deterministic ordering** so pages can never repeat or skip rows: tours `createdAt desc, id asc` (`id` breaks timestamp ties), checkpoints `slug asc`.
- **Client** (`usePaginatedAdminList`): 300 ms debounce → reset to offset 0 behind a skeleton; `loadMore` appends behind a double-fetch guard **and** a query-epoch check so stale responses bow out; an IntersectionObserver sentinel (200 px early) *plus* an explicit "Load more" button (keyboard / IO-less browsers); `removeItem(id)` after a confirmed delete keeps `items`, `total`, and the offset consistent.

## Consequences

- `total` powers the `hasMore` predicate and the "N matches" readout; each page costs two queries (`findMany` + `count`) — accepted.
- **Offset pages can shift** if rows are inserted/deleted between requests; single-operator admin traffic makes this a non-issue (the next debounce refresh re-aligns).
- Stale search responses can no longer paint old results over a new query (epoch check), and first-page vs. load-more failures get distinct recovery affordances (retry card vs. retry button).
- Contract pinned by `tests/search.test.ts` (exact WHERE shapes) and `tests/admin-validation.test.ts` (query bounds/defaults).
