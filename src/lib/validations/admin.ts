import { z } from "zod";

import { normalizePhone } from "@/lib/private-tour-codes";

/** Shared so every required text field reports the same, human, inline message. */
const requiredText = (label: string) =>
  z.string().min(1, { message: `${label} is required.` });

/**
 * `""` is how the forms and the DB column (`coverImageUrl ?? ""`) represent
 * "no cover image", so it has to pass validation alongside real URLs.
 */
const coverImageUrlSchema = z
  .union([
    z
      .string()
      .url({ message: "Enter a full URL, e.g. https://example.com/photo.jpg" }),
    z.literal(""),
  ])
  .optional();

const tourTranslationSchema = z.object({
  name: requiredText("Name"),
  tagline: requiredText("Tagline"),
  description: requiredText("Description"),
  coverImageUrl: coverImageUrlSchema,
});

/**
 * The ordered ids of a tour's stops. Order in the array *is* the visit order,
 * so duplicates are rejected rather than silently collapsed. Shared by the
 * create and update schemas so both enforce the exact same stops contract.
 */
const checkpointIdsSchema = z
  .array(z.string().min(1), { message: "Checkpoint ids must be a list." })
  .max(100, { message: "A tour can have at most 100 stops." })
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "A checkpoint can only appear once on a tour.",
  });

export const createTourSchema = z.object({
  slug: requiredText("Slug"),
  status: z
    .enum(["DRAFT", "PUBLISHED"], { message: "Choose a status." })
    .default("DRAFT"),
  vi: tourTranslationSchema,
  en: tourTranslationSchema,
  /** Optional (empty allowed) so a tour can be created before its stops — mirrors PATCH. */
  checkpointIds: checkpointIdsSchema.optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export const updateTourSchema = z.object({
  id: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  status: z
    .enum(["DRAFT", "PUBLISHED"], { message: "Choose a status." })
    .optional(),
  vi: tourTranslationSchema.optional(),
  en: tourTranslationSchema.optional(),
  checkpointIds: checkpointIdsSchema.optional(),
});

/**
 * Private-tour phone gate (ADR-0006).
 *
 * The value is stored normalized (`normalizePhone`), so validation only has to
 * reject what can never normalize into a usable number. Kept deliberately loose
 * on shape — a strict E.164 regex would reject the local formats Vietnamese
 * customers actually type, and the gate compares normalized digits anyway.
 */
const customerPhoneSchema = z
  .string()
  .trim()
  .min(8, { message: "Enter the customer's phone number." })
  .max(20, { message: "That phone number is too long." })
  .refine((value) => normalizePhone(value).length >= 8, {
    message: "Enter a phone number with at least 8 digits.",
  });

/** Private tours cap at a small, hand-curated itinerary (ADR-0006). */
const privateTourCheckpointIdsSchema = checkpointIdsSchema
  .max(50, { message: "A private tour can have at most 50 stops." })
  .min(1, { message: "Add at least one stop to the private tour." });

export const createPrivateTourSchema = z.object({
  customerName: z.string().trim().max(120).optional(),
  customerPhone: customerPhoneSchema,
  status: z
    .enum(["DRAFT", "ACTIVE", "REVOKED"], { message: "Choose a status." })
    .default("DRAFT"),
  maxSlots: z.coerce
    .number()
    .int()
    .min(1, { message: "Allow at least one visitor." })
    .max(100, { message: "A private tour can allow at most 100 visitors." })
    .default(10),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  vi: tourTranslationSchema,
  en: tourTranslationSchema.optional(),
  checkpointIds: privateTourCheckpointIdsSchema,
});

export const updatePrivateTourSchema = z.object({
  customerName: z.string().trim().max(120).optional(),
  customerPhone: customerPhoneSchema.optional(),
  status: z
    .enum(["DRAFT", "ACTIVE", "REVOKED"], { message: "Choose a status." })
    .optional(),
  maxSlots: z.coerce.number().int().min(1).max(100).optional(),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  vi: tourTranslationSchema.optional(),
  en: tourTranslationSchema.optional(),
  checkpointIds: privateTourCheckpointIdsSchema.optional(),
});

/** The public unlock gate: code + phone, and nothing else (ADR-0006). */
export const privateTourAccessSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, { message: "Enter your tour code." })
    .max(32, { message: "That code is too long." }),
  phone: z
    .string()
    .trim()
    .min(1, { message: "Enter your phone number." })
    .max(20, { message: "That phone number is too long." }),
});

/**
 * "I have arrived at stop N" — the reported position is never trusted, it only
 * feeds the shared GPS policy. `accuracy: null` means the browser refused to
 * report one, which is a legitimate (if imprecise) answer, not an error.
 */
export const privateTourVisitSchema = z.object({
  code: z.string().trim().min(1).max(32),
  checkpointId: z.string().trim().min(1, { message: "Pick a stop." }),
  latitude: z.coerce
    .number()
    .min(-90, { message: "Latitude must be between -90 and 90." })
    .max(90, { message: "Latitude must be between -90 and 90." }),
  longitude: z.coerce
    .number()
    .min(-180, { message: "Longitude must be between -180 and 180." })
    .max(180, { message: "Longitude must be between -180 and 180." }),
  accuracy: z.coerce.number().min(0).nullable().optional(),
});

/**
 * `?q=&take=&offset=` shared by the admin list endpoints. Every part is
 * optional on the wire and parses to a concrete first page: no filter
 * (`q`), 10 rows (`take`), from the top (`offset`). Values arrive as
 * strings from `URLSearchParams`, hence `coerce`; the bounds keep a
 * hand-edited URL from requesting something silly.
 */
export const adminListQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(100, { message: "Search is limited to 100 characters." })
    .default(""),
  take: z.coerce.number().int().min(1).max(50).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

export type AdminListQuery = z.infer<typeof adminListQuerySchema>;
