import type { NextRequest} from "next/server";
import { adminError, adminOk, parseAdminBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-auth";
import { updateTourSchema } from "@/lib/validations/admin";

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const { pathname } = new URL(request.url);
  const slug = pathname.split("/").pop();

  const tour = await prisma.tour.findUnique({
    where: { slug },
    include: {
      translations: true,
      checkpoints: {
        orderBy: { order: "asc" },
        include: { checkpoint: { include: { translations: true } } },
      },
    },
  });

  if (!tour) {
    return adminError("Tour not found", 404);
  }

  return adminOk({
    tour: {
      id: tour.id,
      slug: tour.slug,
      status: tour.status,
      createdAt: tour.createdAt,
      updatedAt: tour.updatedAt,
      vi: tour.translations.find((t) => t.locale === "vi"),
      en: tour.translations.find((t) => t.locale === "en"),
      checkpoints: tour.checkpoints.map((tc) => ({
        id: tc.id,
        order: tc.order,
        checkpointId: tc.checkpoint.id,
        checkpointSlug: tc.checkpoint.slug,
        name: tc.checkpoint.translations.find((t) => t.locale === "vi")?.name ?? tc.checkpoint.slug,
      })),
    },
  });
}

export async function PATCH(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const parsed = parseAdminBody(updateTourSchema, await request.json());
  if (!parsed.ok) return parsed.response;

  const { id, vi, en, status, checkpointIds } = parsed.data;

  const { pathname } = new URL(request.url);
  const slug = pathname.split("/").pop();
  const existing = await prisma.tour.findUnique({ where: { slug } });
  if (!existing) {
    return adminError("Tour not found", 404);
  }
  const tourId = id ?? existing.id;

  // Reject unknown ids before touching anything, so a bad payload cannot wipe
  // the existing stops.
  if (checkpointIds) {
    const found = await prisma.checkpoint.count({
      where: { id: { in: checkpointIds } },
    });
    if (found !== checkpointIds.length) {
      return adminError("Invalid input", 400, {
        details: [
          {
            path: "checkpointIds",
            message: "One or more of those checkpoints no longer exists.",
          },
        ],
      });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.tour.update({
      where: { id: tourId },
      data: {
        slug: slug ?? undefined,
        status: status ?? undefined,
        translations: {
          upsert: [
            ...(vi
              ? [
                  {
                    where: { tourId_locale: { tourId, locale: "vi" } },
                    update: vi,
                    create: { locale: "vi", ...vi, coverImageUrl: vi.coverImageUrl ?? "" },
                  },
                ]
              : []),
            ...(en
              ? [
                  {
                    where: { tourId_locale: { tourId, locale: "en" } },
                    update: en,
                    create: { locale: "en", ...en, coverImageUrl: en.coverImageUrl ?? "" },
                  },
                ]
              : []),
          ],
        },
      },
    });

    // Replace-all: `order` is 1-based and unique per tour, so rewriting the
    // whole set is simpler (and safer) than diffing individual moves.
    if (checkpointIds) {
      await tx.tourCheckpoint.deleteMany({ where: { tourId } });
      if (checkpointIds.length > 0) {
        await tx.tourCheckpoint.createMany({
          data: checkpointIds.map((checkpointId, index) => ({
            tourId,
            checkpointId,
            order: index + 1,
          })),
        });
      }
    }
  });

  return adminOk();
}

export async function DELETE(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const { pathname } = new URL(request.url);
  const slug = pathname.split("/").pop();

  const tour = await prisma.tour.findUnique({ where: { slug } });
  if (!tour) {
    return adminError("Tour not found", 404);
  }

  await prisma.tour.delete({ where: { id: tour.id } });
  return adminOk();
}
