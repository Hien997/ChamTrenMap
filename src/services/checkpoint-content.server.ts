import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  CheckpointWriteError,
  type AdminCheckpoint,
  type AdminGuide,
  type CreateCheckpointInput,
  type UpdateCheckpointInput,
} from "@/services/checkpoint-content";

function toAdminTranslation(
  rows: {
    locale: string;
    name: string;
    summary: string;
    address: string;
    openingHours: string | null;
    bestTimeToVisit: string | null;
  }[],
  locale: "vi" | "en",
): AdminCheckpoint["vi"] {
  const row = rows.find((item) => item.locale === locale);
  return row
    ? {
        name: row.name,
        summary: row.summary,
        address: row.address,
        openingHours: row.openingHours,
        bestTimeToVisit: row.bestTimeToVisit,
      }
    : null;
}

export async function listCheckpointsForAdmin(): Promise<AdminCheckpoint[]> {
  const checkpoints = await prisma.checkpoint.findMany({
    include: {
      translations: true,
      tourLinks: { include: { tour: true } },
    },
    orderBy: { slug: "asc" },
  });
  return checkpoints.map((cp) => ({
    id: cp.id,
    slug: cp.slug,
    latitude: cp.latitude,
    longitude: cp.longitude,
    radiusMeters: cp.radiusMeters,
    estimatedVisitMinutes: cp.estimatedVisitMinutes,
    sortOrderHint: cp.sortOrderHint,
    priceVnd: cp.priceVnd,
    priceKind: cp.priceKind,
    vi: toAdminTranslation(cp.translations, "vi"),
    en: toAdminTranslation(cp.translations, "en"),
    guides: [],
    tours: cp.tourLinks.map((tl) => ({
      tourId: tl.tour.id,
      slug: tl.tour.slug,
      order: tl.order,
    })),
  }));
}

export async function getCheckpointForEdit(
  slug: string,
): Promise<AdminCheckpoint | null> {
  const cp = await prisma.checkpoint.findUnique({
    where: { slug },
    include: {
      translations: true,
      guides: { orderBy: { sortOrder: "asc" } },
      tourLinks: { include: { tour: true } },
    },
  });
  if (!cp) return null;
  return {
    id: cp.id,
    slug: cp.slug,
    latitude: cp.latitude,
    longitude: cp.longitude,
    radiusMeters: cp.radiusMeters,
    estimatedVisitMinutes: cp.estimatedVisitMinutes,
    sortOrderHint: cp.sortOrderHint,
    priceVnd: cp.priceVnd,
    priceKind: cp.priceKind,
    vi: toAdminTranslation(cp.translations, "vi"),
    en: toAdminTranslation(cp.translations, "en"),
    guides: cp.guides.map(
      (g): AdminGuide => ({
        id: g.id,
        locale: g.locale as AdminGuide["locale"],
        content: g.content,
        contentType: g.contentType,
      }),
    ),
    tours: cp.tourLinks.map((tl) => ({
      tourId: tl.tour.id,
      slug: tl.tour.slug,
      order: tl.order,
    })),
  };
}

export async function createCheckpoint(
  input: CreateCheckpointInput,
): Promise<{ id: string; slug: string }> {
  try {
    const existing = await prisma.checkpoint.findUnique({
      where: { slug: input.slug },
    });
    if (existing) {
      throw new CheckpointWriteError("conflict", "Checkpoint already exists");
    }

    const checkpoint = await prisma.checkpoint.create({
      data: {
        slug: input.slug,
        latitude: input.latitude,
        longitude: input.longitude,
        radiusMeters: input.radiusMeters,
        estimatedVisitMinutes: input.estimatedVisitMinutes,
        sortOrderHint: input.sortOrderHint,
        priceVnd: input.priceVnd,
        priceKind: input.priceKind,
        translations: {
          create: [
            { locale: "vi", ...input.vi },
            { locale: "en", ...input.en },
          ],
        },
        guides: input.guides
          ? {
              create: input.guides.map((g) => ({
                locale: g.locale,
                content: sanitizeHtml(g.content),
                contentType: g.contentType,
                sortOrder: 0,
              })),
            }
          : undefined,
      },
    });
    return { id: checkpoint.id, slug: checkpoint.slug };
  } catch (error) {
    if (error instanceof CheckpointWriteError) throw error;
    throw new CheckpointWriteError(
      "storage",
      "Checkpoint error or database error",
    );
  }
}

export async function updateCheckpoint(
  slug: string,
  input: UpdateCheckpointInput,
): Promise<{ id: string; slug: string }> {
  try {
    const existing = await prisma.checkpoint.findUnique({ where: { slug } });
    if (!existing) {
      throw new CheckpointWriteError("not-found", "Not found");
    }

    const checkpoint = await prisma.checkpoint.update({
      where: { id: existing.id },
      data: {
        latitude: input.latitude,
        longitude: input.longitude,
        radiusMeters: input.radiusMeters,
        estimatedVisitMinutes: input.estimatedVisitMinutes,
        sortOrderHint: input.sortOrderHint,
        priceVnd: input.priceVnd,
        priceKind: input.priceKind,
        translations: {
          upsert: [
            {
              where: {
                checkpointId_locale: {
                  checkpointId: existing.id,
                  locale: "vi",
                },
              },
              update: input.vi,
              create: { locale: "vi", ...input.vi },
            },
            {
              where: {
                checkpointId_locale: {
                  checkpointId: existing.id,
                  locale: "en",
                },
              },
              update: input.en,
              create: { locale: "en", ...input.en },
            },
          ],
        },
      },
    });

    if (input.guides) {
      await prisma.guideSection.deleteMany({
        where: { checkpointId: checkpoint.id },
      });
      await prisma.guideSection.createMany({
        data: input.guides.map((g) => ({
          checkpointId: checkpoint.id,
          locale: g.locale,
          content: sanitizeHtml(g.content),
          contentType: g.contentType,
          sortOrder: 0,
        })),
      });
    }

    return { id: checkpoint.id, slug: checkpoint.slug };
  } catch (error) {
    if (error instanceof CheckpointWriteError) throw error;
    throw new CheckpointWriteError("storage", "Database error");
  }
}

export async function deleteCheckpoint(slug: string): Promise<void> {
  const checkpoint = await prisma.checkpoint.findUnique({ where: { slug } });
  if (!checkpoint) {
    throw new CheckpointWriteError("not-found", "Not found");
  }
  await prisma.checkpoint.delete({ where: { id: checkpoint.id } });
}
