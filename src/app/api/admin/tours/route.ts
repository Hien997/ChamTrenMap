import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { createTourSchema } from "@/lib/validations/admin";

export async function GET() {
  await requireAdmin();
  const tours = await prisma.tour.findMany({
    include: {
      translations: true,
      checkpoints: { include: { checkpoint: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    ok: true,
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
  await requireAdmin();
  const body = await request.json();
  const result = createTourSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const tour = await prisma.tour.create({
      data: {
        slug: result.data.slug,
        status: result.data.status,
        translations: {
          create: [
            {
              locale: "vi",
              ...result.data.vi,
              coverImageUrl: result.data.vi.coverImageUrl ?? "",
            },
            {
              locale: "en",
              ...result.data.en,
              coverImageUrl: result.data.en.coverImageUrl ?? "",
            },
          ],
        },
      },
    });

    return NextResponse.json({ ok: true, tour: { id: tour.id, slug: tour.slug } });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Tour already exists or database error" },
      { status: 409 },
    );
  }
}