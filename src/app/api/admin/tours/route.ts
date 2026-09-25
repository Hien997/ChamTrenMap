import type { NextRequest } from "next/server";
import {
  adminError,
  adminOk,
  parseAdminBody,
  parseAdminListQuery,
} from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-auth";
import { buildTourSearchWhere } from "@/services/search";
import { createTourSchema } from "@/lib/validations/admin";

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const query = parseAdminListQuery(request.nextUrl.searchParams);
  if (!query.ok) return query.response;
  const { q, take, offset } = query.data;

  const where = buildTourSearchWhere(q);
  const [tours, total] = await Promise.all([
    prisma.tour.findMany({
      where,
      include: {
        translations: true,
        _count: { select: { checkpoints: true } },
      },
      // `id` breaks createdAt ties so offset paging can't repeat or skip rows.
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: offset,
      take,
    }),
    prisma.tour.count({ where }),
  ]);

  return adminOk({
    items: tours.map((tour) => {
      const vi = tour.translations.find((t) => t.locale === "vi");
      const en = tour.translations.find((t) => t.locale === "en");
      return {
        id: tour.id,
        slug: tour.slug,
        status: tour.status,
        createdAt: tour.createdAt,
        updatedAt: tour.updatedAt,
        vi: vi
          ? {
              name: vi.name,
              tagline: vi.tagline,
              description: vi.description,
              coverImageUrl: vi.coverImageUrl,
            }
          : null,
        en: en
          ? {
              name: en.name,
              tagline: en.tagline,
              description: en.description,
              coverImageUrl: en.coverImageUrl,
            }
          : null,
        checkpointCount: tour._count.checkpoints,
      };
    }),
    total,
  });
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const parsed = parseAdminBody(createTourSchema, await request.json());
  if (!parsed.ok) return parsed.response;
  const data = parsed.data;

  // Reject unknown ids before creating anything, so a stale tab cannot create
  // a tour whose stops silently fail (mirrors the PATCH route's pre-check).
  const { checkpointIds } = data;
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

  try {
    const tour = await prisma.$transaction(async (tx) => {
      const created = await tx.tour.create({
        data: {
          slug: data.slug,
          status: data.status,
          translations: {
            create: [
              {
                locale: "vi",
                ...data.vi,
                coverImageUrl: data.vi.coverImageUrl ?? "",
              },
              {
                locale: "en",
                ...data.en,
                coverImageUrl: data.en.coverImageUrl ?? "",
              },
            ],
          },
        },
      });

      // `order` is 1-based and unique per tour — same contract as PATCH.
      if (checkpointIds && checkpointIds.length > 0) {
        await tx.tourCheckpoint.createMany({
          data: checkpointIds.map((checkpointId, index) => ({
            tourId: created.id,
            checkpointId,
            order: index + 1,
          })),
        });
      }

      return created;
    });

    return adminOk({ tour: { id: tour.id, slug: tour.slug } });
  } catch {
    return adminError("Tour already exists or database error", 409);
  }
}
