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
    z.string().url({ message: "Enter a full URL, e.g. https://example.com/photo.jpg" }),
    z.literal(""),
  ])
  .optional();

const tourTranslationSchema = z.object({
  name: requiredText("Name"),
  tagline: requiredText("Tagline"),
  description: requiredText("Description"),
  coverImageUrl: coverImageUrlSchema,
});

export const createTourSchema = z.object({
  slug: requiredText("Slug"),
  status: z
    .enum(["DRAFT", "PUBLISHED"], { message: "Choose a status." })
    .default("DRAFT"),
  vi: tourTranslationSchema,
  en: tourTranslationSchema,
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

/**
 * The ordered ids of a tour's stops. Order in the array *is* the visit order,
 * so duplicates are rejected rather than silently collapsed.
 */
const checkpointIdsSchema = z
  .array(z.string().min(1), { message: "Checkpoint ids must be a list." })
  .max(100, { message: "A tour can have at most 100 stops." })
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "A checkpoint can only appear once on a tour.",
  });

export const updateTourSchema = z.object({
  id: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"], { message: "Choose a status." }).optional(),
  vi: tourTranslationSchema.optional(),
  en: tourTranslationSchema.optional(),
  checkpointIds: checkpointIdsSchema.optional(),
});
