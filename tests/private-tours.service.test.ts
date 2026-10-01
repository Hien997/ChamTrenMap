import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

import type { Prisma } from "@prisma/client";

import {
  PRIVATE_TOUR_CODE_ALPHABET,
  PRIVATE_TOUR_CODE_LENGTH,
} from "@/config/constants";
import { prisma } from "@/lib/prisma";
import {
  generatePrivateTourCode,
  normalizePhone,
} from "@/lib/private-tour-codes";
import {
  evaluatePrivateTourAccess,
  visitPrivateTourStop,
} from "@/services/private-tours.service";

const NOW = new Date("2026-09-28T00:00:00.000Z");

const activeTour = (overrides = {}) => ({
  status: "ACTIVE",
  customerPhone: "0912345678",
  expiresAt: null,
  maxSlots: 10,
  ...overrides,
});

describe("normalizePhone", () => {
  it("strips the separators a human types", () => {
    expect(normalizePhone("0912 345 678")).toBe("0912345678");
    expect(normalizePhone("0912-345-678")).toBe("0912345678");
    expect(normalizePhone("(0912) 345.678")).toBe("0912345678");
  });

  it("treats +84 and 84 as the local number", () => {
    expect(normalizePhone("+84912345678")).toBe("0912345678");
    expect(normalizePhone("84912345678")).toBe("0912345678");
  });

  it("collapses every spelling of one number to the same digits", () => {
    const spellings = [
      "0912345678",
      "0912 345 678",
      "+84 912 345 678",
      "84-912-345-678",
    ];
    expect(new Set(spellings.map(normalizePhone)).size).toBe(1);
  });

  it("leaves a short number that merely starts with 84 alone", () => {
    // A local landline such as 8499999 must not become 099999.
    expect(normalizePhone("8499999")).toBe("8499999");
  });
});

describe("generatePrivateTourCode", () => {
  it("is the configured length and only uses the safe alphabet", () => {
    for (let i = 0; i < 50; i += 1) {
      const code = generatePrivateTourCode();
      expect(code).toHaveLength(PRIVATE_TOUR_CODE_LENGTH);
      for (const char of code) {
        expect(PRIVATE_TOUR_CODE_ALPHABET).toContain(char);
      }
    }
  });

  it("omits glyph pairs that are misheard when read aloud", () => {
    const generated = Array.from({ length: 200 }, generatePrivateTourCode).join(
      "",
    );
    for (const ambiguous of ["0", "O", "1", "l", "I"]) {
      expect(generated).not.toContain(ambiguous);
    }
  });

  /**
   * The slot race is the one thing unit tests with a mocked Prisma cannot prove,
   * because the guarantee lives in raw SQL the mock never runs. So this reads the
   * source and pins the three properties that make it correct. If someone
   * "simplifies" the transaction back to a plain count-then-insert, this fails.
   */
  describe("slot charging is serialized by a row lock", () => {
    const source = readFileSync(
      new URL("../src/services/private-tours.service.ts", import.meta.url),
      "utf8",
    );
    const unlock = source.slice(
      source.indexOf("export const unlockPrivateTour"),
      source.indexOf("export type PrivateTourVisitResult"),
    );

    it("takes a row lock on the tour before counting holders", () => {
      const lock = unlock.indexOf("FOR UPDATE");
      // The advisory count *before* the lock is deliberate — it lets the common
      // "already full" case bail out without opening a transaction. What must
      // never happen is the deciding count running before the lock, so that is
      // the one this pins: the `tx.`-qualified read inside the transaction.
      const decidingCount = unlock.indexOf("tx.privateTourAccess.count");
      expect(lock).toBeGreaterThan(-1);
      expect(decidingCount).toBeGreaterThan(lock);
    });

    it("re-checks the holder and the count inside the lock", () => {
      // Both reads must be on `tx`, not `prisma`: a `prisma` read escapes the
      // transaction and sees the pre-lock world, which is the race itself.
      const insideLock = unlock.slice(unlock.indexOf("FOR UPDATE"));
      expect(insideLock).toContain("tx.privateTourAccess.findUnique");
      expect(insideLock).toContain("tx.privateTourAccess.count");
    });

    it("refuses rather than overfilling when the last slot is taken", () => {
      expect(unlock).toContain("if (others >= tour.maxSlots) return null");
      expect(unlock).toContain(
        'if (slotsUsedAfter === null) return { status: "denied" }',
      );
    });

    it("is idempotent for one device double-tapping submit", () => {
      // The insert is skipped when this session already holds a slot, so the
      // unique constraint on (privateTourId, sessionKey) is never hit.
      expect(unlock).toMatch(
        /if \(!held\) \{\s*await tx\.privateTourAccess\.create/,
      );
    });
  });

  it("does not repeat itself", () => {
    const codes = new Set(Array.from({ length: 100 }, generatePrivateTourCode));
    expect(codes.size).toBe(100);
  });
});

describe("evaluatePrivateTourAccess — the two gates", () => {
  it("admits a correct code with a correct phone", () => {
    const decision = evaluatePrivateTourAccess({
      tour: activeTour(),
      phone: "0912345678",
      slotsUsed: 0,
      now: NOW,
    });
    expect(decision).toEqual({ ok: true });
  });

  it("accepts a phone typed in any spacing", () => {
    const decision = evaluatePrivateTourAccess({
      tour: activeTour({ customerPhone: "+84912345678" }),
      phone: "0912345678",
      slotsUsed: 0,
      now: NOW,
    });
    expect(decision).toEqual({ ok: true });
  });

  it("refuses when only the code is right", () => {
    const decision = evaluatePrivateTourAccess({
      tour: activeTour(),
      phone: "0999999999",
      slotsUsed: 0,
      now: NOW,
    });
    expect(decision).toEqual({ ok: false, reason: "phone_mismatch" });
  });

  it("refuses when the code does not exist", () => {
    const decision = evaluatePrivateTourAccess({
      tour: null,
      phone: "0912345678",
      slotsUsed: 0,
      now: NOW,
    });
    expect(decision).toEqual({ ok: false, reason: "not_found" });
  });
});

describe("evaluatePrivateTourAccess — lifecycle gates", () => {
  it("refuses a draft tour", () => {
    const decision = evaluatePrivateTourAccess({
      tour: activeTour({ status: "DRAFT" }),
      phone: "0912345678",
      slotsUsed: 0,
      now: NOW,
    });
    expect(decision).toEqual({ ok: false, reason: "not_active" });
  });

  it("refuses a revoked tour", () => {
    const decision = evaluatePrivateTourAccess({
      tour: activeTour({ status: "REVOKED" }),
      phone: "0912345678",
      slotsUsed: 0,
      now: NOW,
    });
    expect(decision).toEqual({ ok: false, reason: "not_active" });
  });

  it("refuses once the expiry has passed", () => {
    const decision = evaluatePrivateTourAccess({
      tour: activeTour({ expiresAt: new Date("2026-09-27T23:59:59.000Z") }),
      phone: "0912345678",
      slotsUsed: 0,
      now: NOW,
    });
    expect(decision).toEqual({ ok: false, reason: "expired" });
  });

  it("admits a tour that expires later today", () => {
    const decision = evaluatePrivateTourAccess({
      tour: activeTour({ expiresAt: new Date("2026-09-28T12:00:00.000Z") }),
      phone: "0912345678",
      slotsUsed: 0,
      now: NOW,
    });
    expect(decision).toEqual({ ok: true });
  });

  it("admits the final slot, then refuses the next one", () => {
    const tenth = evaluatePrivateTourAccess({
      tour: activeTour({ maxSlots: 10 }),
      phone: "0912345678",
      slotsUsed: 9,
      now: NOW,
    });
    const eleventh = evaluatePrivateTourAccess({
      tour: activeTour({ maxSlots: 10 }),
      phone: "0912345678",
      slotsUsed: 10,
      now: NOW,
    });
    expect(tenth).toEqual({ ok: true });
    expect(eleventh).toEqual({ ok: false, reason: "no_slots" });
  });
});

describe("evaluatePrivateTourAccess — the shared-error contract", () => {
  it("collapses every failure mode to one client-visible outcome", () => {
    // ADR-0006: the reason is server-side only, so an attacker cannot use the
    // message to learn whether a code exists. Distinct internal reasons...
    const failures = [
      evaluatePrivateTourAccess({
        tour: null,
        phone: "0912345678",
        slotsUsed: 0,
        now: NOW,
      }),
      evaluatePrivateTourAccess({
        tour: activeTour(),
        phone: "0000000000",
        slotsUsed: 0,
        now: NOW,
      }),
      evaluatePrivateTourAccess({
        tour: activeTour({ status: "REVOKED" }),
        phone: "0912345678",
        slotsUsed: 0,
        now: NOW,
      }),
      evaluatePrivateTourAccess({
        tour: activeTour({ expiresAt: new Date("2020-01-01T00:00:00.000Z") }),
        phone: "0912345678",
        slotsUsed: 0,
        now: NOW,
      }),
      evaluatePrivateTourAccess({
        tour: activeTour({ maxSlots: 1 }),
        phone: "0912345678",
        slotsUsed: 1,
        now: NOW,
      }),
    ];

    for (const failure of failures) {
      expect(failure.ok).toBe(false);
    }
    // Five distinct internal reasons...
    const reasons = new Set(failures.map((f) => (f.ok ? "ok" : f.reason)));
    expect(reasons.size).toBe(5);
    expect([...reasons].sort()).toEqual([
      "expired",
      "no_slots",
      "not_active",
      "not_found",
      "phone_mismatch",
    ]);
  });
});

/**
 * The refusal contract spans two files no unit test can exercise together: the
 * route needs cookies and a database, the itinerary needs a browser. Both
 * properties below were real bugs — an English-only error shown to Vietnamese
 * visitors, and three translation keys that were never rendered — so they are
 * pinned by reading the source, exactly like the row-lock test above.
 */
describe("private-tour visit refusals", () => {
  const read = (relativePath: string) =>
    readFileSync(new URL(relativePath, import.meta.url), "utf8");

  it("sends numbers as `details`, never pre-formatted prose", () => {
    const route = read("../src/app/api/private-tours/visit/route.ts");
    expect(route).toContain(
      'apiError("TOO_FAR", "Too far from the stop", 422, {',
    );
    expect(route).toContain(
      'apiError("POOR_ACCURACY", "GPS accuracy too low", 422, {',
    );
    // Its own code, so the client can say "not on this tour" instead of
    // reusing the `denied` NOT_FOUND and mislabelling a revoked tour.
    expect(route).toContain('"NOT_IN_ITINERARY"');
  });

  it("renders a localized message for every refusal the server can send", () => {
    const itinerary = read("../src/components/tour/PrivateTourItinerary.tsx");
    for (const code of ["TOO_FAR", "POOR_ACCURACY", "NOT_IN_ITINERARY"]) {
      expect(itinerary).toContain(`case "${code}"`);
    }
    // The keys exist in vi/en (parity pinned by messages.test.ts); actually
    // rendering them is what keeps a Vietnamese visitor out of English prose.
    for (const key of ["tooFar", "poorAccuracy", "notInItinerary"]) {
      expect(itinerary).toContain(`t("${key}"`);
    }
  });

  it("keeps both private-tour routes out of search results", () => {
    for (const page of [
      "../src/app/[locale]/private-tour/page.tsx",
      "../src/app/[locale]/private-tour/[code]/page.tsx",
    ]) {
      expect(read(page)).toContain("robots: { index: false, follow: false }");
    }
  });
});

/**
 * The visit path is the *write* half of a private tour, so it needs the same
 * gate the read path applies: a session that holds a slot on **this** tour. The
 * route can only see that a `ctm_private` cookie arrived — the value is
 * client-supplied and never verified — so checking there instead of here would
 * be theatre. These run against a spied Prisma, because the guarantee is which
 * queries the service makes, and in what order.
 */
describe("visitPrivateTourStop — the holder gate", () => {
  type TourWithStops = Prisma.PrivateTourGetPayload<{
    include: { stops: true };
  }>;

  const TOUR_ID = "tour-1";
  const SESSION_KEY = "key-1";

  const tourRecord = (): TourWithStops => ({
    id: TOUR_ID,
    code: "ABCD2345",
    customerPhone: "0912345678",
    customerName: null,
    status: "ACTIVE",
    startsAt: null,
    expiresAt: null,
    maxSlots: 10,
    createdAt: new Date("2026-09-28T00:00:00.000Z"),
    updatedAt: new Date("2026-09-28T00:00:00.000Z"),
    stops: [
      {
        id: "stop-1",
        privateTourId: TOUR_ID,
        checkpointId: "cp-1",
        order: 1,
      },
    ],
  });

  const visitAt = (checkpointId: string) => ({
    code: "ABCD2345",
    sessionKey: SESSION_KEY,
    checkpointId,
    latitude: 10.3826,
    longitude: 104.4835,
    accuracy: 12,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(prisma.privateTour, "findUnique").mockResolvedValue(tourRecord());
  });

  it("refuses a caller who holds no slot, whatever code they quote", async () => {
    vi.spyOn(prisma.privateTourAccess, "findUnique").mockResolvedValue(null);
    const checkpoint = vi.spyOn(prisma.checkpoint, "findUnique");
    const write = vi.spyOn(prisma.privateTourVisit, "create");

    expect(await visitPrivateTourStop(visitAt("cp-1"))).toEqual({
      status: "denied",
    });
    // Refused before reading a checkpoint or judging GPS, so nothing is written.
    expect(checkpoint).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it("does not tell a non-holder which checkpoints are on the tour", async () => {
    vi.spyOn(prisma.privateTourAccess, "findUnique").mockResolvedValue(null);

    // `cp-9` is not a stop. A holder learns that (`not_in_itinerary`); a caller
    // with a borrowed key must only ever see the indistinguishable `denied`.
    expect(await visitPrivateTourStop(visitAt("cp-9"))).toEqual({
      status: "denied",
    });
  });

  it("keeps the honest answer for a holder", async () => {
    // The service reads only `id`, but the spy is typed to the whole row.
    vi.spyOn(prisma.privateTourAccess, "findUnique").mockResolvedValue({
      id: "access-1",
      privateTourId: TOUR_ID,
      sessionKey: SESSION_KEY,
      firstAccessAt: new Date("2026-09-28T00:00:00.000Z"),
    });

    expect(await visitPrivateTourStop(visitAt("cp-9"))).toEqual({
      status: "not_in_itinerary",
    });
  });

  it("looks the slot up by the (tour, session) pair, never by the key alone", async () => {
    const access = vi
      .spyOn(prisma.privateTourAccess, "findUnique")
      .mockResolvedValue(null);

    await visitPrivateTourStop(visitAt("cp-1"));

    // A key that spent its slot on a *different* tour must not pass here — the
    // same pairing rule `unlockPrivateTour` charges against.
    expect(access).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          privateTourId_sessionKey: {
            privateTourId: TOUR_ID,
            sessionKey: SESSION_KEY,
          },
        },
      }),
    );
  });
});
