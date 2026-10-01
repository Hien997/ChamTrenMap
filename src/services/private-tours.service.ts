import { Prisma, type Prisma as PrismaTypes } from "@prisma/client";

import { MAX_GPS_ACCURACY_METERS, type Locale } from "@/config/constants";
import { evaluateCheckIn, haversineMeters } from "@/lib/geo";
import { prisma } from "@/lib/prisma";
import {
  generatePrivateTourCode,
  normalizePhone,
} from "@/lib/private-tour-codes";
import { pickLocalized } from "@/services/localize";
import { buildPrivateTourSearchWhere } from "@/services/search";
import type { PrivateTourDetailView, PrivateTourListItem } from "@/types";

/**
 * Private tours (ADR-0006).
 *
 * The read path is two independent gates — a code and a phone number — and
 * **every** rejection collapses into one `denied` result. That is the whole
 * point: if "no such code" and "wrong phone" were distinguishable, an attacker
 * could confirm a code exists and then brute-force the number. Do not
 * "improve" this by returning more specific errors; the indistinguishability is
 * the security property, and it is why the reason never reaches the client.
 */
export type PrivateTourAccessResult =
  | { status: "ok"; tour: PrivateTourDetailView; slotsUsed: number }
  | { status: "denied" };

/** Why an unlock was refused. Server-side only — never returned. */
type DenialReason =
  "not_found" | "phone_mismatch" | "not_active" | "expired" | "no_slots";

const isExpired = (expiresAt: Date | null, now: Date): boolean =>
  expiresAt !== null && expiresAt.getTime() <= now.getTime();

/**
 * Decide whether an unlock may proceed. Pure, so the rule is testable without a
 * database — and so every failure mode is provably mapped to the single
 * `denied` outcome rather than relying on each call site to remember.
 */
export const evaluatePrivateTourAccess = (input: {
  tour: {
    status: string;
    customerPhone: string;
    expiresAt: Date | null;
    maxSlots: number;
  } | null;
  phone: string;
  slotsUsed: number;
  now: Date;
}): { ok: true } | { ok: false; reason: DenialReason } => {
  const { tour } = input;
  if (!tour) return { ok: false, reason: "not_found" };
  if (normalizePhone(tour.customerPhone) !== input.phone) {
    return { ok: false, reason: "phone_mismatch" };
  }
  if (tour.status !== "ACTIVE") return { ok: false, reason: "not_active" };
  if (isExpired(tour.expiresAt, input.now)) {
    return { ok: false, reason: "expired" };
  }
  if (input.slotsUsed >= tour.maxSlots)
    return { ok: false, reason: "no_slots" };
  return { ok: true };
};

const privateTourInclude = {
  translations: true,
  stops: {
    orderBy: { order: "asc" },
    include: { checkpoint: { include: { translations: true } } },
  },
} as const;

type PrivateTourRecord = PrismaTypes.PrivateTourGetPayload<{
  include: typeof privateTourInclude;
}>;

const toDetailView = (
  tour: PrivateTourRecord,
  locale: Locale,
  visits: Set<string>,
): PrivateTourDetailView => {
  const localized = pickLocalized(tour.translations, locale);
  return {
    code: tour.code,
    name: localized?.name ?? "",
    tagline: localized?.tagline ?? "",
    description: localized?.description ?? "",
    coverImageUrl: localized?.coverImageUrl ?? "",
    startsAt: tour.startsAt?.toISOString() ?? null,
    stops: tour.stops.map((stop) => {
      const cp = pickLocalized(stop.checkpoint.translations, locale);
      return {
        checkpointId: stop.checkpointId,
        order: stop.order,
        name: cp?.name ?? stop.checkpoint.slug,
        summary: cp?.summary ?? "",
        address: cp?.address ?? "",
        latitude: stop.checkpoint.latitude,
        longitude: stop.checkpoint.longitude,
        radiusMeters: stop.checkpoint.radiusMeters,
        estimatedVisitMinutes: stop.checkpoint.estimatedVisitMinutes,
        visited: visits.has(stop.checkpointId),
      };
    }),
  };
};

/**
 * Unlock a private tour. Consumes one slot unless this session already holds
 * one, so re-opening the itinerary on the same device is free.
 */
export const unlockPrivateTour = async (input: {
  code: string;
  phone: string;
  sessionKey: string;
  locale: Locale;
  now?: Date;
}): Promise<PrivateTourAccessResult> => {
  const now = input.now ?? new Date();
  const phone = normalizePhone(input.phone);
  const code = input.code.trim().toUpperCase();

  const tour = await prisma.privateTour.findUnique({
    where: { code },
    include: privateTourInclude,
  });

  // A returning holder is never charged a second slot (ADR-0006), so the slot
  // count must exclude this session's own access — otherwise the 10th visitor
  // is locked out of their own itinerary the moment they re-open it. The
  // authoritative recount happens under a row lock further down.
  const slotsUsed = tour
    ? await prisma.privateTourAccess.count({
        where: {
          privateTourId: tour.id,
          sessionKey: { not: input.sessionKey },
        },
      })
    : 0;

  const decision = evaluatePrivateTourAccess({
    tour: tour
      ? {
          status: tour.status,
          customerPhone: tour.customerPhone,
          expiresAt: tour.expiresAt,
          maxSlots: tour.maxSlots,
        }
      : null,
    phone,
    slotsUsed,
    now,
  });

  if (!decision.ok || !tour) return { status: "denied" };

  // Charge the slot under a row lock. The check above read the count outside a
  // transaction, so two devices racing on the last slot would both see
  // "9 of 10 used" and both insert — overshooting the cap. Locking the tour row
  // serialises them: the second waits, then re-reads the count *after* the
  // first insert commits and sees the slot gone.
  //
  // Two details this block has to get right:
  //
  // 1. The recount excludes this session's own row, exactly like the count
  //    above. Counting it would lock a returning holder out of their own
  //    itinerary the moment the tenth device arrived — they hold a slot, so
  //    "full" must mean "full by *other* people".
  // 2. The insert is an upsert, and the existence check is re-done inside the
  //    lock. `existing` was read before we held the lock, so a double-tapped
  //    submit from one device would otherwise see null twice and hit the
  //    unique constraint on (privateTourId, sessionKey) — a 500, for a user who
  //    did nothing wrong.
  const slotsUsedAfter = await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "PrivateTour" WHERE id = ${tour.id} FOR UPDATE`;

      const held = await tx.privateTourAccess.findUnique({
        where: {
          privateTourId_sessionKey: {
            privateTourId: tour.id,
            sessionKey: input.sessionKey,
          },
        },
        select: { id: true },
      });

      const others = await tx.privateTourAccess.count({
        where: {
          privateTourId: tour.id,
          sessionKey: { not: input.sessionKey },
        },
      });
      if (others >= tour.maxSlots) return null;

      if (!held) {
        await tx.privateTourAccess.create({
          data: { privateTourId: tour.id, sessionKey: input.sessionKey },
        });
      }
      // Total holders now, this one included.
      return others + 1;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  );

  // Lost the race for the last slot: report the same `denied` as any other
  // refusal, because the client cannot tell "full" from "wrong phone" anyway.
  if (slotsUsedAfter === null) return { status: "denied" };

  const visits = await prisma.privateTourVisit.findMany({
    where: { privateTourId: tour.id, sessionKey: input.sessionKey },
    select: { checkpointId: true },
  });

  return {
    status: "ok",
    tour: toDetailView(
      tour,
      input.locale,
      new Set(visits.map((v) => v.checkpointId)),
    ),
    slotsUsed: slotsUsedAfter,
  };
};

export type PrivateTourVisitResult =
  | { status: "ok"; order: number; alreadyVisited: boolean }
  | { status: "too_far"; distanceMeters: number; radiusMeters: number }
  | { status: "poor_accuracy"; accuracy: number; maxAccuracy: number }
  | { status: "not_in_itinerary" }
  | { status: "denied" };

/**
 * Record "I have arrived at stop N".
 *
 * Decided **on the server** with the shared `evaluateCheckIn` seam — the same
 * GPS policy the public check-in obeys. The client is never asked to judge its
 * own position, and no `CheckIn`/`TourProgress` row is written: a private tour
 * records proximity, not achievement (ADR-0006).
 *
 * The caller must also **hold a slot on this tour**, exactly as the read path
 * requires: the `ctm_private` cookie is opaque and client-supplied, so the
 * route can only see that *a* key arrived, never that it was ever granted one.
 * Without this check a leaked code alone would be enough to write visits (and
 * to probe which checkpoints are on the tour) — the second gate, the phone
 * number, would be bypassed by anyone who never had to unlock at all.
 *
 * Order is deliberately not enforced — a private itinerary is a suggestion, so
 * a customer may visit stop 3 before stop 1.
 */
export const visitPrivateTourStop = async (input: {
  code: string;
  sessionKey: string;
  checkpointId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
}): Promise<PrivateTourVisitResult> => {
  const tour = await prisma.privateTour.findUnique({
    where: { code: input.code.trim().toUpperCase() },
    include: { stops: true },
  });
  if (
    !tour ||
    tour.status !== "ACTIVE" ||
    isExpired(tour.expiresAt, new Date())
  ) {
    return { status: "denied" };
  }

  // The holder gate runs *before* the itinerary lookup on purpose: answering
  // `not_in_itinerary` first would let a code-holder who never unlocked the
  // tour map its checkpoints one id at a time (`denied` vs a different
  // refusal). A refusal here is the same indistinguishable `denied` the unlock
  // route returns, so a borrowed key learns nothing.
  const holdsSlot = await prisma.privateTourAccess.findUnique({
    where: {
      privateTourId_sessionKey: {
        privateTourId: tour.id,
        sessionKey: input.sessionKey,
      },
    },
    select: { id: true },
  });
  if (!holdsSlot) return { status: "denied" };

  const stop = tour.stops.find((s) => s.checkpointId === input.checkpointId);
  if (!stop) return { status: "not_in_itinerary" };

  const checkpoint = await prisma.checkpoint.findUnique({
    where: { id: input.checkpointId },
  });
  if (!checkpoint) return { status: "not_in_itinerary" };

  const distanceMeters = haversineMeters(
    { latitude: input.latitude, longitude: input.longitude },
    { latitude: checkpoint.latitude, longitude: checkpoint.longitude },
  );

  const existing = await prisma.privateTourVisit.findUnique({
    where: {
      privateTourId_sessionKey_checkpointId: {
        privateTourId: tour.id,
        sessionKey: input.sessionKey,
        checkpointId: input.checkpointId,
      },
    },
  });

  const decision = evaluateCheckIn({
    distanceMeters,
    accuracyMeters: input.accuracy,
    radiusMeters: checkpoint.radiusMeters,
    maxAccuracyMeters: MAX_GPS_ACCURACY_METERS,
    alreadyCheckedIn: existing !== null,
    isLocked: false, // no sequential unlock in private tours (ADR-0006)
  });

  if (decision.status === "poor_accuracy") return decision;
  if (decision.status === "too_far") return decision;

  if (!existing) {
    await prisma.privateTourVisit.create({
      data: {
        privateTourId: tour.id,
        sessionKey: input.sessionKey,
        checkpointId: input.checkpointId,
      },
    });
  }

  return { status: "ok", order: stop.order, alreadyVisited: existing !== null };
};

/**
 * Admin listing — includes the phone, which the public API never returns.
 *
 * `q` arrives already validated by `adminListQuerySchema` (ADR-0003), and the
 * **same** `where` feeds `findMany` and `count` — otherwise `total` would count
 * rows the filter excluded and the client's `hasMore`/load-more would page into
 * nothing.
 *
 * The two reads run in parallel rather than in a `$transaction`: they are
 * independent, and a transaction would not buy a consistent snapshot anyway
 * (READ COMMITTED still shows each statement its own view) while holding a
 * pooled connection for both. This matches the public tour list route.
 */
export const listPrivateTours = async (options: {
  q: string;
  take: number;
  offset: number;
}): Promise<{ items: PrivateTourListItem[]; total: number }> => {
  const where = buildPrivateTourSearchWhere(options.q);

  const [tours, total] = await Promise.all([
    prisma.privateTour.findMany({
      where,
      // `id` breaks createdAt ties so offset paging can't repeat or skip rows.
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: options.take,
      skip: options.offset,
      include: {
        translations: true,
        _count: { select: { stops: true, accesses: true } },
      },
    }),
    prisma.privateTour.count({ where }),
  ]);

  return {
    total,
    items: tours.map((tour) => ({
      id: tour.id,
      code: tour.code,
      status: tour.status,
      customerName: tour.customerName,
      customerPhone: tour.customerPhone,
      name:
        pickLocalized(tour.translations, "vi")?.name ??
        pickLocalized(tour.translations, "en")?.name ??
        tour.code,
      stopCount: tour._count.stops,
      slotsUsed: tour._count.accesses,
      maxSlots: tour.maxSlots,
      startsAt: tour.startsAt?.toISOString() ?? null,
      expiresAt: tour.expiresAt?.toISOString() ?? null,
      createdAt: tour.createdAt.toISOString(),
    })),
  };
};

/** Mint a code that is not already taken (collision is astronomically rare). */
export const reserveUniqueCode = async (attempt = 5): Promise<string> => {
  for (let i = 0; i < attempt; i += 1) {
    const code = generatePrivateTourCode();
    const taken = await prisma.privateTour.findUnique({ where: { code } });
    if (!taken) return code;
  }
  throw new Error("Could not allocate a unique private-tour code");
};

/** One translation row ready to upsert, for either locale. */
type TranslationInput = {
  name: string;
  tagline: string;
  description: string;
  coverImageUrl?: string;
};

/**
 * Create a private tour and mint its code.
 *
 * The phone is normalized on write so the compare in `evaluatePrivateTourAccess`
 * never has to guess at the caller's formatting (ADR-0006).
 */
export const createPrivateTour = async (input: {
  customerName?: string;
  customerPhone: string;
  status: "DRAFT" | "ACTIVE" | "REVOKED";
  maxSlots: number;
  startsAt?: Date;
  expiresAt?: Date;
  vi: TranslationInput;
  en?: TranslationInput;
  checkpointIds: string[];
}) => {
  const code = await reserveUniqueCode();

  return prisma.privateTour.create({
    data: {
      code,
      customerPhone: normalizePhone(input.customerPhone),
      customerName: input.customerName?.trim() || null,
      status: input.status,
      maxSlots: input.maxSlots,
      startsAt: input.startsAt ?? null,
      expiresAt: input.expiresAt ?? null,
      translations: {
        create: [
          // `coverImageUrl` is a non-null column, so an omitted form field
          // becomes the empty string — same as the public tour form.
          {
            locale: "vi",
            ...input.vi,
            coverImageUrl: input.vi.coverImageUrl ?? "",
          },
          ...(input.en
            ? [
                {
                  locale: "en",
                  ...input.en,
                  coverImageUrl: input.en.coverImageUrl ?? "",
                },
              ]
            : []),
        ],
      },
      stops: {
        create: input.checkpointIds.map((checkpointId, index) => ({
          checkpointId,
          order: index + 1,
        })),
      },
    },
    include: { translations: true },
  });
};

/** Read one private tour for the admin edit form, with its stops in order. */
export const getPrivateTourForAdmin = async (id: string) => {
  return prisma.privateTour.findUnique({
    where: { id },
    include: {
      translations: true,
      stops: { orderBy: { order: "asc" } },
      _count: { select: { stops: true, accesses: true } },
    },
  });
};

/**
 * Update a private tour, replacing the stop set atomically.
 *
 * The code is deliberately **not** editable: it is already in the customer's
 * hands, and re-issuing one would silently break the link they were given.
 * Revoke and create a new tour instead.
 */
export const updatePrivateTour = async (input: {
  id: string;
  customerName?: string;
  customerPhone?: string;
  status?: "DRAFT" | "ACTIVE" | "REVOKED";
  maxSlots?: number;
  startsAt?: Date;
  expiresAt?: Date;
  vi?: TranslationInput;
  en?: TranslationInput;
  checkpointIds?: string[];
}) =>
  prisma.$transaction(async (tx) => {
    await tx.privateTour.update({
      where: { id: input.id },
      data: {
        customerName:
          input.customerName === undefined
            ? undefined
            : input.customerName.trim() || null,
        customerPhone: input.customerPhone
          ? normalizePhone(input.customerPhone)
          : undefined,
        status: input.status,
        maxSlots: input.maxSlots,
        startsAt: input.startsAt,
        expiresAt: input.expiresAt,
        translations: {
          upsert: [
            ...(input.vi
              ? [
                  {
                    where: {
                      privateTourId_locale: {
                        privateTourId: input.id,
                        locale: "vi",
                      },
                    },
                    update: input.vi,
                    create: {
                      locale: "vi",
                      ...input.vi,
                      coverImageUrl: input.vi.coverImageUrl ?? "",
                    },
                  },
                ]
              : []),
            ...(input.en
              ? [
                  {
                    where: {
                      privateTourId_locale: {
                        privateTourId: input.id,
                        locale: "en",
                      },
                    },
                    update: input.en,
                    create: {
                      locale: "en",
                      ...input.en,
                      coverImageUrl: input.en.coverImageUrl ?? "",
                    },
                  },
                ]
              : []),
          ],
        },
      },
    });

    // Replace-all: `order` is 1-based and unique per tour, so rewriting the set
    // matches what the drag-and-drop editor produced (ADR-0004, same rule).
    if (input.checkpointIds) {
      await tx.privateTourStop.deleteMany({
        where: { privateTourId: input.id },
      });
      if (input.checkpointIds.length > 0) {
        await tx.privateTourStop.createMany({
          data: input.checkpointIds.map((checkpointId, index) => ({
            privateTourId: input.id,
            checkpointId,
            order: index + 1,
          })),
        });
      }
    }
  });

/**
 * Delete a private tour.
 *
 * Cascades clear its stops, translations and access records. The `Checkpoints`
 * themselves are shared with public tours, so nothing else is affected.
 */
export const deletePrivateTour = async (id: string) => {
  await prisma.privateTour.delete({ where: { id } });
};
