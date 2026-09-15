import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { updateCheckpointSchema } from "@/lib/validations/admin";
import { sanitizeHtml } from "@/lib/sanitize";

export async function GET(request: NextRequest) {
  await requireAdmin();
  const { pathname } = new URL(request.url);
  const slug = pathname.split("/").pop();

  const checkpoint = await prisma.checkpoint.findUnique({
    where: { slug },
    include: {
      translations: true,
      images: { orderBy: { sortOrder: "asc" } },
      guides: { orderBy: { sortOrder: "asc" } },
      tourLinks: { include: { tour: true } },
    },
  });

  if (!checkpoint) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    checkpoint: {
      id: checkpoint.id,
      slug: checkpoint.slug,
      latitude: checkpoint.latitude,
      longitude: checkpoint.longitude,
      radiusMeters: checkpoint.radiusMeters,
      estimatedVisitMinutes: checkpoint.estimatedVisitMinutes,
      sortOrderHint: checkpoint.sortOrderHint,
      priceVnd: checkpoint.priceVnd,
      priceKind: checkpoint.priceKind,
      vi: checkpoint.translations.find((t) => t.locale === "vi"),
      en: checkpoint.translations.find((t) => t.locale === "en"),
      images: checkpoint.images.map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        sortOrder: img.sortOrder,
        isThumbnail: img.isThumbnail,
      })),
      guides: checkpoint.guides.map((g) => ({
        id: g.id,
        locale: g.locale,
        content: g.content,
        contentType: g.contentType,
      })),
      tours: checkpoint.tourLinks.map((tl) => ({
        tourId: tl.tour.id,
        slug: tl.tour.slug,
        order: tl.order,
      })),
    },
  });
}

export async function PATCH(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();
  const result = updateCheckpointSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid input" },
      { status: 400 },
    );
  }

  const {
    latitude,
    longitude,
    radiusMeters,
    estimatedVisitMinutes,
    sortOrderHint,
    priceVnd,
    priceKind,
    vi,
    en,
    guides,
  } = result.data;

  try {
    // Resolve the record by URL slug — same lookup contract as GET/DELETE.
    // (A previous version trusted a client-supplied `id` and fell back to
    // `where: { id: slug }`, which made Prisma look up a cuid by the slug
    // value and fail whenever only a slug was sent.)
    const { pathname } = new URL(request.url);
    const slug = pathname.split("/").pop();

    const existing = await prisma.checkpoint.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const checkpoint = await prisma.checkpoint.update({
      where: { id: existing.id },
      data: {
        latitude,
        longitude,
        radiusMeters,
        estimatedVisitMinutes,
        sortOrderHint,
        priceVnd,
        priceKind,
        translations: {
          upsert: [
            {
              where: { checkpointId_locale: { checkpointId: existing.id, locale: "vi" } },
              update: vi,
              create: { locale: "vi", ...vi },
            },
            {
              where: { checkpointId_locale: { checkpointId: existing.id, locale: "en" } },
              update: en,
              create: { locale: "en", ...en },
            },
          ],
        },
      },
    });

    // Replace all guide documents (one per locale)
    if (guides) {
      await prisma.guideSection.deleteMany({ where: { checkpointId: checkpoint.id } });
      await prisma.guideSection.createMany({
        data: guides.map((g) => ({
          checkpointId: checkpoint.id,
          locale: g.locale,
          content: sanitizeHtml(g.content),
          contentType: g.contentType,
          sortOrder: 0,
        })),
      });
    }

    return NextResponse.json({ ok: true, checkpoint: { id: checkpoint.id, slug: checkpoint.slug } });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Database error" },
      { status: 409 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  await requireAdmin();
  const { pathname } = new URL(request.url);
  const slug = pathname.split("/").pop();

  const checkpoint = await prisma.checkpoint.findUnique({ where: { slug } });
  if (!checkpoint) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  await prisma.checkpoint.delete({ where: { id: checkpoint.id } });
  return NextResponse.json({ ok: true });
}