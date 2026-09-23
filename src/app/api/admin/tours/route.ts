import type { NextRequest} from "next/server";
import { adminError, adminOk, parseAdminBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-auth";
import { createTourSchema } from "@/lib/validations/admin";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const tours = await prisma.tour.findMany({
    include: {
      translations: true,
      checkpoints: { include: { checkpoint: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return adminOk({
    tours: tours.map((tour) => {
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
        checkpointCount: tour.checkpoints.length,
      };
    }),
  });
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const parsed = parseAdminBody(createTourSchema, await request.json());
  if (!parsed.ok) return parsed.response;
  const data = parsed.data;

  try {
    const tour = await prisma.tour.create({
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

    return adminOk({ tour: { id: tour.id, slug: tour.slug } });
  } catch {
    return adminError("Tour already exists or database error", 409);
  }
}