# ADR-0004 — Tour stops: validate first, then rewrite atomically

- **Status:** Accepted (recorded retroactively) · 2026-09-23
- **Source:** PATCH design finalized by feature commit `6dbeaec` (stops-on-create); `src/app/api/admin/tours/route.ts`, `src/app/api/admin/tours/[slug]/route.ts`
- **Related:** `CONTEXT.md` (Stop) · `docs/logic-map.md` §3 R9, §6.3

## Context

`TourCheckpoint.order` is 1-based and unique per tour, and the admin payload's **array order is the visit order**. Editing stops means adds, removes, and reorders arriving as one value. Options: **(a)** diff the existing links move-by-move — complex, and mid-diff moves collide with the `unique(tourId, order)` constraint; **(b)** rewrite the whole set — simple, but only safe if unknown ids can't wipe real stops and the tour row plus its stops never diverge.

## Decision

Rewrite whole-set **inside one transaction, guarded by a pre-check**:

1. **Zod first** — `checkpointIdsSchema`: max 100 entries, rejects duplicates (array order carries meaning, so collapsing would silently change the route).
2. **Route pre-check before any write** — `checkpoint.count({ id: { in: ids } })` must equal `ids.length`; otherwise **400** with `details.path = "checkpointIds"` ("One or more of those checkpoints no longer exists."). A stale admin tab can therefore never delete-then-fail.
3. **One `prisma.$transaction`** — update the tour (plus translation upserts) *and* `tourCheckpoint.deleteMany` → `createMany` with `order = index + 1`. `POST` builds a new tour the same way (create + `createMany` stops in one tx), so create and update share a single stops contract.

Any failure inside the transaction (FK, unique) aborts it wholesale — stops are never left half-written.

## Consequences

- No intermediate order collisions: within the transaction the old set is deleted before the new one exists.
- Concurrent edits are **last-write-wins**; single-admin operation makes this acceptable.
- Duplicate rejection lives in Zod, not the database — the DB would accept the same checkpoint twice at different orders; the schema forbids it one layer earlier.
- Deliberately **no empty-tour / PUBLISHED-requires-stops rule**: a tour may be created or edited with zero stops (agreed gap — see `docs/logic-map.md` §9; adding one would be a new decision).
- Contract pinned by `tests/admin-validation.test.ts`; behavior exercised by the isolated-worktree verification of commit `6dbeaec`.
