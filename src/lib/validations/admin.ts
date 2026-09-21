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
  id: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
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
