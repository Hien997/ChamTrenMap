import { z } from "zod";

import type { Locale } from "@/config/constants";
import { pickLocalized } from "@/services/localize";
import type { CheckpointDetailView, GuideSectionView } from "@/types";

export interface AdminGuide {
  id?: string;
  locale: "vi" | "en";
  content: string;
  contentType: "TEXT" | "HTML";
}

export interface AdminTranslation {
  name: string;
  summary: string;
  address: string;
  openingHours?: string | null;
  bestTimeToVisit?: string | null;
}

export interface AdminCheckpoint {
  id: string;
  slug: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  estimatedVisitMinutes: number;
  sortOrderHint: number;
  priceVnd: number | null;
  priceKind: "TICKET" | "FOOD";
  vi: AdminTranslation | null;
  en: AdminTranslation | null;
  guides: AdminGuide[];
  tours?: { tourId: string; slug: string; order: number }[];
}

/** Shared so every required text field reports the same, human, inline message. */
const requiredText = (label: string) =>
  z.string().min(1, { message: `${label} is required.` });

// Defined once so the create schema can re-use them with a `.default(...)`
// without repeating every rule (and every message).
const latitudeField = z
  .number({ message: "Enter a latitude." })
  .min(-90, { message: "Latitude must be between -90 and 90." })
  .max(90, { message: "Latitude must be between -90 and 90." });

const longitudeField = z
  .number({ message: "Enter a longitude." })
  .min(-180, { message: "Longitude must be between -180 and 180." })
  .max(180, { message: "Longitude must be between -180 and 180." });

const radiusMetersField = z
  .number({ message: "Enter a check-in radius." })
  .int({ message: "Radius must be a whole number of metres." })
  .min(1, { message: "Radius must be at least 1 metre." });

const estimatedVisitMinutesField = z
  .number({ message: "Enter a visit length." })
  .int({ message: "Visit length must be a whole number of minutes." })
  .min(1, { message: "Visit length must be at least 1 minute." });

const sortOrderHintField = z
  .number({ message: "Enter a sort order." })
  .int({ message: "Sort order must be a whole number." })
  .min(0, { message: "Sort order cannot be negative." });

const priceKindField = z.enum(["TICKET", "FOOD"], {
  message: "Choose a price kind.",
});

const checkpointBaseSchema = z.object({
  latitude: latitudeField,
  longitude: longitudeField,
  radiusMeters: radiusMetersField,
  estimatedVisitMinutes: estimatedVisitMinutesField,
  sortOrderHint: sortOrderHintField,
  priceVnd: z
    .number({ message: "Enter a price in VND." })
    .int({ message: "Price must be a whole number of VND." })
    .nonnegative({ message: "Price cannot be negative." })
    .nullable()
    .optional(),
  priceKind: priceKindField,
  vi: z.object({
    name: requiredText("Name"),
    summary: requiredText("Summary"),
    address: requiredText("Address"),
    openingHours: z.string().optional().nullable(),
    bestTimeToVisit: z.string().optional().nullable(),
  }),
  en: z.object({
    name: requiredText("Name"),
    summary: requiredText("Summary"),
    address: requiredText("Address"),
    openingHours: z.string().optional().nullable(),
    bestTimeToVisit: z.string().optional().nullable(),
  }),
  guides: z
    .array(
      z.object({
        id: z.string().optional(),
        locale: z.enum(["vi", "en"]),
        content: z.string().min(1, { message: "Guide content is required." }),
        contentType: z.literal("HTML").default("HTML"),
      }),
    )
    .optional(),
});

export const createCheckpointSchema = checkpointBaseSchema.extend({
  slug: requiredText("Slug"),
  radiusMeters: radiusMetersField.default(100),
  estimatedVisitMinutes: estimatedVisitMinutesField.default(30),
  sortOrderHint: sortOrderHintField.default(0),
  priceKind: priceKindField.default("TICKET"),
});

export const updateCheckpointSchema = checkpointBaseSchema.extend({
  slug: z.string().min(1).optional(),
});

export type CreateCheckpointInput = z.output<typeof createCheckpointSchema>;
export type UpdateCheckpointInput = z.output<typeof updateCheckpointSchema>;
export type CreateCheckpointPayload = Partial<CreateCheckpointInput>;
export type UpdateCheckpointPayload = Partial<UpdateCheckpointInput>;

export class CheckpointWriteError extends Error {
  readonly status: number;

  constructor(
    readonly kind: "conflict" | "not-found" | "storage",
    message: string,
  ) {
    super(message);
    this.name = "CheckpointWriteError";
    this.status = kind === "not-found" ? 404 : 409;
  }
}

interface TranslationRow {
  locale: string;
  name: string;
  summary: string;
  address: string;
  openingHours: string | null;
  bestTimeToVisit: string | null;
}

export interface CheckpointContentRow {
  id: string;
  slug: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  estimatedVisitMinutes: number;
  priceVnd: number | null;
  priceKind: string;
  translations: TranslationRow[];
  images: { url: string; alt: string | null; isThumbnail: boolean }[];
  guides: { locale: string; content: string; contentType: string }[];
}

export interface CheckpointSummary {
  id: string;
  slug: string;
  latitude: number;
  longitude: number;
  name: string;
  summary: string;
  thumbnailUrl: string | null;
}

export function toCheckpointDetail(
  row: CheckpointContentRow,
  locale: Locale,
): CheckpointDetailView {
  const translation = pickLocalized(row.translations, locale);
  const guide = pickLocalized(row.guides, locale);
  const guides: GuideSectionView[] = guide
    ? [
        {
          locale: guide.locale as "vi" | "en",
          content: guide.content,
          contentType: guide.contentType as GuideSectionView["contentType"],
        },
      ]
    : [];

  return {
    id: row.id,
    slug: row.slug,
    latitude: row.latitude,
    longitude: row.longitude,
    radiusMeters: row.radiusMeters,
    estimatedVisitMinutes: row.estimatedVisitMinutes,
    priceVnd: row.priceVnd,
    priceKind: row.priceKind === "FOOD" ? "food" : "ticket",
    name: translation?.name ?? row.slug,
    summary: translation?.summary ?? "",
    address: translation?.address ?? "",
    openingHours: translation?.openingHours ?? null,
    bestTimeToVisit: translation?.bestTimeToVisit ?? null,
    thumbnailUrl:
      row.images.find((img) => img.isThumbnail)?.url ??
      row.images[0]?.url ??
      null,
    images: row.images.map((img) => ({ url: img.url, alt: img.alt })),
    guides,
  };
}

export function toCheckpointSummary(
  row: Pick<
    CheckpointContentRow,
    "id" | "slug" | "latitude" | "longitude" | "translations" | "images"
  >,
  locale: Locale,
): CheckpointSummary {
  const translation = pickLocalized(row.translations, locale);
  return {
    id: row.id,
    slug: row.slug,
    latitude: row.latitude,
    longitude: row.longitude,
    name: translation?.name ?? row.slug,
    summary: translation?.summary ?? "",
    thumbnailUrl: row.images[0]?.url ?? null,
  };
}

/**
 * Minimal read surface shared by `FormData` (flat dotted keys) and
 * react-hook-form's values object (nested, because `register("vi.name")`
 * builds `{ vi: { name } }`). Every rule below is written once against this
 * getter, so the FormData parsers and the RHF resolvers cannot drift apart.
 */
type FormValueReader = (name: string) => unknown;

function fromFormData(formData: FormData): FormValueReader {
  return (name) => formData.get(name);
}

function fromFormValues(values: Record<string, unknown>): FormValueReader {
  return (name) => {
    let node: unknown = values;
    for (const key of name.split(".")) {
      if (node === null || node === undefined || typeof node !== "object") {
        return null;
      }
      node = (node as Record<string, unknown>)[key];
    }
    return node ?? null;
  };
}

function numberField(read: FormValueReader, name: string): number | undefined {
  const raw = read(name);
  if (raw === null) return undefined;
  return Number.parseFloat(String(raw));
}

function intField(read: FormValueReader, name: string): number | undefined {
  const raw = read(name);
  if (raw === null) return undefined;
  return Number.parseInt(String(raw), 10);
}

function readFormTranslation(
  read: FormValueReader,
  prefix: string,
): AdminTranslation {
  return {
    name: String(read(`${prefix}.name`) ?? ""),
    summary: String(read(`${prefix}.summary`) ?? ""),
    address: String(read(`${prefix}.address`) ?? ""),
    openingHours: (read(`${prefix}.openingHours`) as string | null) || null,
    bestTimeToVisit:
      (read(`${prefix}.bestTimeToVisit`) as string | null) || null,
  };
}

/**
 * Reads `guide.<locale>.content` fields. Blank locales are skipped, content
 * is trimmed, and existing ids are re-attached so an update replaces rows
 * instead of duplicating them. An empty result means "no guide content":
 * create stores none, update clears all (its replace-all semantics).
 */
function readGuidesFromForm(
  read: FormValueReader,
  currentGuides: AdminGuide[] = [],
): NonNullable<CreateCheckpointPayload["guides"]> {
  const guides: NonNullable<CreateCheckpointPayload["guides"]> = [];
  for (const locale of ["vi", "en"] as const) {
    const existing = currentGuides.find((g) => g.locale === locale);
    const content = String(read(`guide.${locale}.content`) ?? "").trim();
    if (!content) continue;
    guides.push({
      id: existing?.id,
      locale,
      content,
      contentType: "HTML",
    });
  }
  return guides;
}

function collectCreatePayload(read: FormValueReader): CreateCheckpointPayload {
  return {
    slug: String(read("slug") ?? ""),
    latitude: numberField(read, "latitude"),
    longitude: numberField(read, "longitude"),
    radiusMeters: intField(read, "radiusMeters"),
    estimatedVisitMinutes: intField(read, "estimatedVisitMinutes"),
    sortOrderHint: intField(read, "sortOrderHint"),
    priceVnd: read("priceVnd") ? (numberField(read, "priceVnd") ?? null) : null,
    priceKind: (read("priceKind") as "TICKET" | "FOOD" | null) ?? undefined,
    vi: readFormTranslation(read, "vi"),
    en: readFormTranslation(read, "en"),
    guides: readGuidesFromForm(read),
  };
}

function collectUpdatePayload(
  read: FormValueReader,
  currentGuides: AdminGuide[],
): UpdateCheckpointPayload {
  return {
    latitude: numberField(read, "latitude"),
    longitude: numberField(read, "longitude"),
    radiusMeters: intField(read, "radiusMeters"),
    estimatedVisitMinutes: intField(read, "estimatedVisitMinutes"),
    sortOrderHint: intField(read, "sortOrderHint"),
    priceVnd: read("priceVnd") ? (numberField(read, "priceVnd") ?? null) : null,
    priceKind: (read("priceKind") as "TICKET" | "FOOD" | null) ?? undefined,
    vi: readFormTranslation(read, "vi"),
    en: readFormTranslation(read, "en"),
    guides: readGuidesFromForm(read, currentGuides),
  };
}

export function parseCheckpointCreateForm(
  formData: FormData,
): CreateCheckpointPayload {
  return collectCreatePayload(fromFormData(formData));
}

/**
 * react-hook-form twin of {@link parseCheckpointCreateForm}: the resolver's
 * nested values object goes through the exact same rules, so the two paths
 * can never disagree on what the form means.
 */
export function parseCheckpointCreateValues(
  values: Record<string, unknown>,
): CreateCheckpointPayload {
  return collectCreatePayload(fromFormValues(values));
}

export function parseCheckpointUpdateForm(
  formData: FormData,
  currentGuides: AdminGuide[],
): UpdateCheckpointPayload {
  return collectUpdatePayload(fromFormData(formData), currentGuides);
}

/** react-hook-form twin of {@link parseCheckpointUpdateForm}. */
export function parseCheckpointUpdateValues(
  values: Record<string, unknown>,
  currentGuides: AdminGuide[],
): UpdateCheckpointPayload {
  return collectUpdatePayload(fromFormValues(values), currentGuides);
}
