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

function numberField(formData: FormData, name: string): number | undefined {
  const raw = formData.get(name);
  if (raw === null) return undefined;
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

export function parseCheckpointUpdateForm(
  formData: FormData,
  currentGuides: AdminGuide[],
): UpdateCheckpointPayload {
  const guides: NonNullable<UpdateCheckpointPayload["guides"]> = [];
  for (const locale of ["vi", "en"] as const) {
    const existing = currentGuides.find((g) => g.locale === locale);
    const content = String(formData.get(`guide.${locale}.content`) ?? "").trim();
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
