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
