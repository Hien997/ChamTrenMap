import { z } from "zod";

import type { Locale } from "@/config/constants";
import { pickLocalized } from "@/services/localize";
import type { CheckpointDetailView, GuideSectionView } from "@/types";

/**
 * The checkpoint-content module — one deep owner of the checkpoint concept:
 * shapes, validation, public view mapping, and form parsing. Field names
 * live here and nowhere else. Server reads/writes live in
 * checkpoint-content.server; routes shrink to auth + envelope + one call.
 *
 * This file is client-safe (no prisma, no node builtins) — client forms
 * import shapes and parsers from it.
 */

// ---------- shapes (the one definition) ----------

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
  /** Tours the checkpoint belongs to (admin list/edit views). */
  tours?: { tourId: string; slug: string; order: number }[];
}

// ---------- validation (moved from lib/validations/admin) ----------

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

/** Validated shape the write functions accept. */
export type CreateCheckpointInput = z.output<typeof createCheckpointSchema>;
export type UpdateCheckpointInput = z.output<typeof updateCheckpointSchema>;
/** Wire shape a client form posts: every field may be absent; zod decides. */
export type CreateCheckpointPayload = Partial<CreateCheckpointInput>;
export type UpdateCheckpointPayload = Partial<UpdateCheckpointInput>;

// ---------- write errors ----------

/** HTTP status rides the error; routes stay dumb. */
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

// ---------- public view mapping (consumed by checkpoints.service) ----------

interface TranslationRow {
  locale: string;
  name: string;
  summary: string;
  address: string;
  openingHours: string | null;
  bestTimeToVisit: string | null;
}

/** Minimal shape of a checkpoint row with translations, images and guides. */
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

/** Map a checkpoint row onto the public detail view (Plan.md §6). */
export function toCheckpointDetail(
  row: CheckpointContentRow,
  locale: Locale,
): CheckpointDetailView {
  const translation = pickLocalized(row.translations, locale);
  // One guide row per locale; pick the requested locale (vi fallback).
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

/** Map a checkpoint row onto the public list/marker view. */
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

// ---------- form parsing (the one FormData mapping) ----------

function numberField(formData: FormData, name: string): number | undefined {
  const raw = formData.get(name);
  if (raw === null) return undefined;
  // Present-but-unparseable becomes NaN so validation rejects it loudly;
  // absent becomes undefined so create-time defaults can apply.
  return Number.parseFloat(String(raw));
}

function intField(formData: FormData, name: string): number | undefined {
  const raw = formData.get(name);
  if (raw === null) return undefined;
  return Number.parseInt(String(raw), 10);
}

function readFormTranslation(
  formData: FormData,
  prefix: string,
): AdminTranslation {
  return {
    name: String(formData.get(`${prefix}.name`) ?? ""),
    summary: String(formData.get(`${prefix}.summary`) ?? ""),
    address: String(formData.get(`${prefix}.address`) ?? ""),
    openingHours:
      (formData.get(`${prefix}.openingHours`) as string | null) || null,
    bestTimeToVisit:
      (formData.get(`${prefix}.bestTimeToVisit`) as string | null) || null,
  };
}

/** Parse the "new checkpoint" form into a create payload (validate over the wire). */
export function parseCheckpointCreateForm(
  formData: FormData,
): CreateCheckpointPayload {
  return {
    slug: String(formData.get("slug") ?? ""),
    latitude: numberField(formData, "latitude"),
    longitude: numberField(formData, "longitude"),
    radiusMeters: intField(formData, "radiusMeters"),
    estimatedVisitMinutes: intField(formData, "estimatedVisitMinutes"),
    sortOrderHint: intField(formData, "sortOrderHint"),
    priceVnd: formData.get("priceVnd")
      ? (numberField(formData, "priceVnd") ?? null)
      : null,
    priceKind: (formData.get("priceKind") as "TICKET" | "FOOD" | null) ?? undefined,
    vi: readFormTranslation(formData, "vi"),
    en: readFormTranslation(formData, "en"),
  };
}

/** Parse the edit form into an update payload; guide docs are read per locale. */
export function parseCheckpointUpdateForm(
  formData: FormData,
  currentGuides: AdminGuide[],
): UpdateCheckpointPayload {
  const guides: NonNullable<UpdateCheckpointPayload["guides"]> = [];
  for (const locale of ["vi", "en"] as const) {
    const existing = currentGuides.find((g) => g.locale === locale);
    const content = String(formData.get(`guide.${locale}.content`) ?? "").trim();
    // Skip empty locales so the write doesn't create empty guide rows.
    if (!content) continue;
    guides.push({
      id: existing?.id,
      locale,
      content,
      contentType: "HTML",
    });
  }

  return {
    latitude: numberField(formData, "latitude"),
    longitude: numberField(formData, "longitude"),
    radiusMeters: intField(formData, "radiusMeters"),
    estimatedVisitMinutes: intField(formData, "estimatedVisitMinutes"),
    sortOrderHint: intField(formData, "sortOrderHint"),
    priceVnd: formData.get("priceVnd")
      ? (numberField(formData, "priceVnd") ?? null)
      : null,
    priceKind: (formData.get("priceKind") as "TICKET" | "FOOD" | null) ?? undefined,
    vi: readFormTranslation(formData, "vi"),
    en: readFormTranslation(formData, "en"),
    guides,
  };
}
