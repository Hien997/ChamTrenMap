import { z } from "zod";

/** POST /api/checkins — Plan.md §6/§12. Coordinates are re-validated server-side. */
export const createCheckInSchema = z.object({
  checkpointId: z.string().min(1).max(64),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  /** GPS accuracy in meters; omitted/null when the browser does not provide it. */
  accuracy: z.number().positive().max(10_000).nullable().optional(),
});
export type CreateCheckInInput = z.infer<typeof createCheckInSchema>;

/** POST /api/share/checkin */
export const createShareLinkSchema = z.object({
  checkInId: z.string().min(1).max(64),
});
export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>;

/** ?locale= on public endpoints. */
export const localeQuerySchema = z.enum(["vi", "en"]).default("vi");
