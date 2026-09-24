# ADR-0002 — Sequential unlock as derived state

- **Status:** Accepted (recorded retroactively) · 2026-09-23
- **Source:** core check-in design; `src/services/progress-status.ts`, `src/services/checkins.service.ts`
- **Related:** `CONTEXT.md` (GPS policy, Tour progress) · `docs/logic-map.md` §3 R1–R4

## Context

A tour is an ordered list of stops and visitors must walk it front-to-back. Every view — tour detail, map, progress API, the check-in gate itself — needs each stop's per-visitor status: done, the next one, or locked. Two modeling options: **(a)** persist a status per (user, checkpoint) row and maintain it on every write, or **(b)** derive statuses on read from the ordered stop ids plus the set of check-ins.

## Decision

**Derive.** `deriveStatuses(orderedCheckpointIds, completedCheckpointIds)` is a pure function: `completed` = has a CheckIn, `current` = the first id not completed (there is at most one), `locked` = everything else. The only persisted progress facts are `CheckIn` rows (unique per user + checkpoint) and `TourProgress.startedAt` / `completedAt`. The check-in gate calls the same derivation server-side before `evaluateCheckIn`, and tour completion is stamped once — inside the check-in transaction — the moment the completed set first covers the whole tour.

## Consequences

- **No desync possible:** there is no status column to drift when stops are reordered or deleted — every read re-derives from source facts.
- **Read cost** is one query for the visitor's check-ins plus an O(stops) pass, executed in `buildProgressView`, `getTourDetail`, the map RSC, and `createCheckIn` — trivial at this scale.
- **Reordering a published tour retroactively re-derives statuses for every visitor** (accepted: the admin owns visit order; completed stops stay completed, the frontier moves).
- The pure function *is* the test surface: `tests/progress-status.test.ts` + `tests/checkins.service.test.ts`.
- The only materialized bits (`TourProgress.startedAt/completedAt`) exist for "started at" bookkeeping and completion display, not for gating.
