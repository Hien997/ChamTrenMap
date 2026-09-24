import { z } from "zod";

import {
  createCheckpointSchema,
  parseCheckpointCreateValues,
  parseCheckpointUpdateValues,
  updateCheckpointSchema,
  type AdminCheckpoint,
  type UpdateCheckpointPayload,
} from "@/services/checkpoint-content";

/**
 * Field-by-field shape the RHF forms register — numbers and enums stay
 * strings because that is what a DOM input yields (`valueAsNumber` is not
 * used anywhere; the shared field readers coerce exactly as before).
 */
export type CheckpointCreateFormValues = {
  slug: string;
  latitude: string;
  longitude: string;
  radiusMeters: string;
  estimatedVisitMinutes: string;
  sortOrderHint: string;
  priceVnd: string;
  priceKind: string;
  vi: CheckpointTranslationFormValues;
  en: CheckpointTranslationFormValues;
  guide: { vi: { content: string }; en: { content: string } };
};

type CheckpointTranslationFormValues = {
  name: string;
  summary: string;
  address: string;
  openingHours: string;
  bestTimeToVisit: string;
};

/** The edit form has no slug input — slug is immutable there. */
export type CheckpointUpdateFormValues = Omit<
  CheckpointCreateFormValues,
  "slug"
>;

/**
 * What the edit resolver hands `onSubmit`: the validated fields plus the
 * identity keys. `updateCheckpointSchema` does not declare `id`/`slug` (zod
 * strips them), yet the PATCH body needs them — so the wrapper re-attaches
 * them after validation, exactly as the old FormData flow did.
 */
export type CheckpointUpdateSubmit = UpdateCheckpointPayload & {
  id: string;
  slug: string;
};

/** Verbatim defaults the create form shipped with before the RHF migration. */
export const CREATE_DEFAULT_VALUES: CheckpointCreateFormValues = {
  slug: "",
  latitude: "10.3864",
  longitude: "104.4516",
  radiusMeters: "100",
  estimatedVisitMinutes: "30",
  sortOrderHint: "0",
  priceVnd: "",
  priceKind: "TICKET",
  vi: {
    name: "",
    summary: "",
    address: "",
    openingHours: "",
    bestTimeToVisit: "",
  },
  en: {
    name: "",
    summary: "",
    address: "",
    openingHours: "",
    bestTimeToVisit: "",
  },
  guide: { vi: { content: "" }, en: { content: "" } },
};

/** Flattens a stored checkpoint into edit defaults (nullable → empty string). */
export function editDefaultValues(
  checkpoint: AdminCheckpoint,
): CheckpointUpdateFormValues {
  const translation = (t: AdminCheckpoint["vi"]) => ({
    name: t?.name ?? "",
    summary: t?.summary ?? "",
    address: t?.address ?? "",
    openingHours: t?.openingHours ?? "",
    bestTimeToVisit: t?.bestTimeToVisit ?? "",
  });
  const guideContent = (locale: "vi" | "en") =>
    checkpoint.guides.find((g) => g.locale === locale)?.content ?? "";
  return {
    latitude: String(checkpoint.latitude),
    longitude: String(checkpoint.longitude),
    radiusMeters: String(checkpoint.radiusMeters),
    estimatedVisitMinutes: String(checkpoint.estimatedVisitMinutes),
    sortOrderHint: String(checkpoint.sortOrderHint),
    priceVnd: checkpoint.priceVnd == null ? "" : String(checkpoint.priceVnd),
    priceKind: checkpoint.priceKind,
    vi: translation(checkpoint.vi),
    en: translation(checkpoint.en),
    guide: { vi: { content: guideContent("vi") }, en: { content: guideContent("en") } },
  };
}

/**
 * Thin wrapper (grill Q2): registered form values are strings/nested objects,
 * so we run the same field-reader core the FormData parsers use to build the
 * payload, then defer to the real API schema. Its issues re-attach at their
 * original dotted paths (`vi.name`, `latitude`, …) so react-hook-form can
 * hand them to the form primitives for inline display.
 */
export const createCheckpointFormSchema = z
  .custom<CheckpointCreateFormValues>(() => true)
  .transform((values, ctx) => {
    const result = createCheckpointSchema.safeParse(
      parseCheckpointCreateValues(values),
    );
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          code: "custom",
          path: issue.path,
          message: issue.message,
        });
      }
      return z.NEVER;
    }
    return result.data;
  });

/**
 * Edit twin: binds the checkpoint identity (and its current guides, for id
 * re-attachment) into the resulting PATCH payload.
 */
export function updateCheckpointFormSchema(
  checkpoint: Pick<AdminCheckpoint, "id" | "slug" | "guides">,
) {
  return z
    .custom<CheckpointUpdateFormValues>(() => true)
    .transform((values, ctx) => {
      const payload = {
        ...parseCheckpointUpdateValues(values, checkpoint.guides),
        id: checkpoint.id,
        slug: checkpoint.slug,
      };
      const result = updateCheckpointSchema.safeParse(payload);
      if (!result.success) {
        for (const issue of result.error.issues) {
          ctx.addIssue({
            code: "custom",
            path: issue.path,
            message: issue.message,
          });
        }
        return z.NEVER;
      }
      // Submit exactly what the old FormData flow submitted: the validated
      // fields plus id/slug (which updateCheckpointSchema would strip).
      return payload;
    });
}

/**
 * Server `details` paths whose root has a registered input — only these are
 * mirrored with `setError`; everything else (`guides.*`, empty → general)
 * has no inline slot, so the toast is its sole surface (grill Q5).
 */
const FORM_FIELD_ROOTS = new Set([
  "slug",
  "latitude",
  "longitude",
  "radiusMeters",
  "estimatedVisitMinutes",
  "sortOrderHint",
  "priceVnd",
  "priceKind",
  "vi",
  "en",
  "guide",
]);

export function isCheckpointFormPath(path: string): boolean {
  return FORM_FIELD_ROOTS.has(path.split(".")[0]);
}