import { z } from "zod";

export const createCheckInSchema = z.object({
  checkpointId: z.string().min(1).max(64),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().max(10_000).nullable().optional(),
});
export type CreateCheckInInput = z.infer<typeof createCheckInSchema>;

export const createShareLinkSchema = z.object({
  checkInId: z.string().min(1).max(64),
});
export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>;

export const localeQuerySchema = z.enum(["vi", "en"]).default("vi");
