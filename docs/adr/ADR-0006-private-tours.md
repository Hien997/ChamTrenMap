# ADR-0006 — Private tours run beside public tours, gated by code + phone

- **Status:** Accepted · 2026-09-28
- **Source:** feature request "tours private" (custom tours booked per customer); `src/services/private-tours.service.ts`, `src/app/api/private-tours/*`
- **Related:** `CONTEXT.md` (Private tour) · `docs/logic-map.md` §4 · ADR-0001 (visitor seam), ADR-0004 (atomic stops)

## Context

A private tour is a run built for one named customer: the admin composes an itinerary from **existing** `Checkpoint`s, then sends the customer a short code. The customer enters **that code plus their phone number** to open the itinerary — no account, no login, no public listing. Two requirements make the obvious design wrong:

1. **It is not a `Tour`.** A `Tour` is published, browsable, slug-addressed, and carries a `TourProgress`/unlock chain. A private tour is unlisted, code-addressed, individually revocable, and expires. Reusing `Tour` would mean dragging `status` semantics, a public slug, and the sequential-unlock model (`CONTEXT.md`, ADR-0002) into a flow that has none of them.
2. **The code alone is not authorization.** A customer's code is handed over over SMS/phone, so it will eventually leak. The phone number is the second factor — a leaked code plus a guessed number is not enough.

## Decision

**A separate model family, parallel to — not derived from — `Tour`.** `PrivateTour` + `PrivateTourTranslation` + `PrivateTourStop` re-declare the translation and stop tables (rather than pointing at `TourTranslation`/`TourCheckpoint`, which are FKs bound to `tourId`) but **reference the same `Checkpoint` rows**. Checkpoints are shared content; a private tour is a different *use* of them.

**Two independent gates on the read path**, both required:

1. `code` — unique, 8 chars, generated from an alphabet that omits look-alike glyphs (`0/O`, `1/l/I`), so a code read aloud over the phone is not mistyped into a wrong-but-valid code.
2. `customerPhone` — compared after normalization (strip spaces/dots/dashes; `+84`/`84` → leading `0`).

**Every rejection returns one indistinguishable error.** Wrong code, wrong phone, expired, revoked, and exhausted all produce the same body and status. Distinguishing them would let an attacker confirm a code exists and then brute-force the phone (or the reverse); the one shared message removes that oracle.

**The slot cap counts access grants, not people.** There is no customer login, so "who" is unknowable; one `PrivateTourAccess` row per successful unlock is the honest unit. Ten slots means ten unlocks. This is weaker than "ten people" — one customer on two devices spends two slots — and is accepted deliberately: a real per-person cap needs OTP, a new dependency, and a new failure mode. Revisit only if a real abuse pattern appears.

**`PrivateTourVisit` records proximity, not progress.** Per ADR-0002 the public progress model is *derived*, and this feature deliberately does **not** write `CheckIn`/`TourProgress`: a private tour is a schedule, not an achievement. Instead a "Tôi đã tới" action sends coordinates to the server, which reuses the existing `haversineMeters` + `evaluateCheckIn` seam and answers only "you are near stop N" or "not yet". The client is never trusted with the decision, exactly as the public GPS policy requires. Visits are **not** order-enforced — a private itinerary is a suggestion, and a customer may visit 3 before 1.

**No `User` row is created for a private-tour customer.** They never check in publicly and never hold a share link, so they stay outside the ADR-0001 visitor/admin seam. Identity is the `ctm_private` cookie (opaque session key), used only to count slots and attribute visits — it opens no page, because no page reads it.

## Consequences

- Duplication is deliberate: `PrivateTourStop` mirrors `TourCheckpoint` instead of sharing it, because those rows are FK-bound to `tourId` and a stop is a value that belongs to exactly one kind of tour.
- Stop writes follow ADR-0004 verbatim — pre-check that every `checkpointId` exists, then rewrite the whole set inside one transaction with 1-based `order`.
- Slot counting is serialized with a row lock. The first draft counted outside a transaction and was racy: two simultaneous unlocks could both read "9 used" and both succeed, yielding 11. The shipped `unlockPrivateTour` instead re-counts inside a transaction that takes `SELECT … FOR UPDATE` on the tour row (ReadCommitted), so the cap actually holds; `tests/private-tours.service.test.ts` pins the lock-before-deciding-count ordering so a later "simplification" fails loudly. The pre-existing `rateLimit` seam is still process-local (next bullet).
- `customerPhone` is stored **normalized, in plaintext**, so admin can re-read it. If a privacy rule later requires hashing, the lookup must switch from `findUnique` to a scan-with-compare — flagged here because it is a real cost, not a free change.
- The in-memory `rateLimit` seam does not survive multi-instance deploys. **Pre-existing** limitation, shared with admin login and public check-in; not fixed here to avoid widening scope. Recorded in `docs/logic-map.md` §9.
- **The code URL alone is never access, and neither is a previously spent unlock.** `/private-tour/[code]` used to render the itinerary server-side off the `ctm_private` holder key, so entering the code and phone once on a device made that link openable from then on — refresh included — with no way to ask for either gate again. The route now performs **no read at all**: no cookie lookup, no query, no existence check, so a real code and a made-up one are indistinguishable. `PrivateTourUnlockGate` holds the itinerary only as the body of a successful `POST /api/private-tours/access`, and only in client state, which is what makes "every entry re-asks" true — a server component cannot tell a fresh unlock from an old cookie, because both arrive as the same request headers. Re-entering the code is free: `unlockPrivateTour` upserts the `(tour, session)` slot rather than inserting, so a returning holder is never charged a second slot, and its response already re-marks that session's arrivals. The cookie survives only to attribute `/visit` writes. Pinned by `tests/private-tour-ui.test.ts`.
- **Both halves of the customer path demand the grant, not just the cookie.** The visit path used to accept `ctm_private` on its own, and that was a hole rather than a shortcut: the value is client-supplied, so the route can only prove a key *arrived*, never that it was ever granted one. A leaked code plus a forged key could therefore write `PrivateTourVisit` rows — and probe which checkpoints are on the tour — without the phone gate ever being satisfied. `visitPrivateTourStop` checks the grant, and does so *before* the itinerary lookup, because answering `not_in_itinerary` first would make the endpoint an oracle for one checkpoint id at a time.

- Contract pinned by `tests/private-tours.service.test.ts`; the two-gate rule and the shared-error contract are covered there.