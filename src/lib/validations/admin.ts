import { z } from "zod";

export const createTourSchema = z.object({
  slug: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  vi: z.object({
    name: z.string().min(1),
    tagline: z.string().min(1),
    description: z.string().min(1),
    coverImageUrl: z.string().url().optional(),
  }),
  en: z.object({
    name: z.string().min(1),
    tagline: z.string().min(1),
    description: z.string().min(1),
    coverImageUrl: z.string().url().optional(),
  }),
});

export const updateTourSchema = z.object({
  // Prisma ids are cuids (not UUIDs). `id` is optional — the PATCH handler
  // resolves the record from the URL slug when it isn't supplied.
  id: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  // NOTE: no .default() here — an omitted `status` in PATCH must leave the
  // existing value untouched (defaults would silently reset it to DRAFT).
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  vi: z
    .object({
      name: z.string().min(1),
      tagline: z.string().min(1),
      description: z.string().min(1),
      coverImageUrl: z.string().url().optional(),
    })
    .optional(),
  en: z
    .object({
      name: z.string().min(1),
      tagline: z.string().min(1),
      description: z.string().min(1),
      coverImageUrl: z.string().url().optional(),
    })
    .optional(),
});

// Base shape shared by create/update. Fields that have sensible defaults for
// NEW records are layered on in createCheckpointSchema only.
const checkpointBaseSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().int().min(1),
  estimatedVisitMinutes: z.number().int().min(1),
  sortOrderHint: z.number().int().min(0),
  priceVnd: z.number().int().nonnegative().nullable().optional(),
  priceKind: z.enum(["TICKET", "FOOD"]),
  vi: z.object({
    name: z.string().min(1),
    summary: z.string().min(1),
    address: z.string().min(1),
    openingHours: z.string().optional().nullable(),
    bestTimeToVisit: z.string().optional().nullable(),
  }),
  en: z.object({
    name: z.string().min(1),
    summary: z.string().min(1),
    address: z.string().min(1),
    openingHours: z.string().optional().nullable(),
    bestTimeToVisit: z.string().optional().nullable(),
  }),
  guides: z
    .array(
      z.object({
        id: z.string().optional(),
        locale: z.enum(["vi", "en"]),
        content: z.string().min(1),
        contentType: z.literal("HTML").default("HTML"),
      }),
    )
    .optional(),
});

export const createCheckpointSchema = checkpointBaseSchema.extend({
  slug: z.string().min(1),
  radiusMeters: z.number().int().min(1).default(100),
  estimatedVisitMinutes: z.number().int().min(1).default(30),
  sortOrderHint: z.number().int().min(0).default(0),
  priceKind: z.enum(["TICKET", "FOOD"]).default("TICKET"),
});

// NOTE: no .default() on any numeric/kind field — an omitted field in PATCH
// must be a hard 400, not a silent reset to the create-time default.
export const updateCheckpointSchema = checkpointBaseSchema.extend({
  // Present for payload symmetry with the edit form; the PATCH handler
  // resolves the record from the URL slug, which is authoritative.
  slug: z.string().min(1).optional(),
});
