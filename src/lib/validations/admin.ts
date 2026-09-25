import { z } from "zod";

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
