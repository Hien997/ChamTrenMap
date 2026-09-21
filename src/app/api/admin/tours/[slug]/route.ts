import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { updateTourSchema } from "@/lib/validations/admin";

export async function GET(request: NextRequest) {
  await requireAdmin();
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
    return NextResponse.json({ ok: false, error: "Tour not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
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
  await requireAdmin();
  const body = await request.json();
  const result = updateTourSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid input" },
      { status: 400 },
    );
  }

  const { id, vi, en, status } = result.data;

  const { pathname } = new URL(request.url);
  const slug = pathname.split("/").pop();
  const existing = await prisma.tour.findUnique({ where: { slug } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Tour not found" }, { status: 404 });
  }
  const tourId = id ?? existing.id;

  await prisma.tour.update({
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

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  await requireAdmin();
  const { pathname } = new URL(request.url);
  const slug = pathname.split("/").pop();

  const tour = await prisma.tour.findUnique({ where: { slug } });
  if (!tour) {
    return NextResponse.json({ ok: false, error: "Tour not found" }, { status: 404 });
  }

  await prisma.tour.delete({ where: { id: tour.id } });
  return NextResponse.json({ ok: true });
}
