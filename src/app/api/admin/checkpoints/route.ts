import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { createCheckpointSchema } from "@/lib/validations/admin";
import { sanitizeHtml } from "@/lib/sanitize";

export async function GET() {
  await requireAdmin();
  const checkpoints = await prisma.checkpoint.findMany({
    include: {
      translations: true,
      tourLinks: { include: { tour: true } },
    },
    orderBy: { slug: "asc" },
  });

  return NextResponse.json({
    ok: true,
    checkpoints: checkpoints.map((cp) => ({
      id: cp.id,
      slug: cp.slug,
      latitude: cp.latitude,
      longitude: cp.longitude,
      radiusMeters: cp.radiusMeters,
      estimatedVisitMinutes: cp.estimatedVisitMinutes,
      sortOrderHint: cp.sortOrderHint,
      priceVnd: cp.priceVnd,
      priceKind: cp.priceKind,
      vi: cp.translations.find((t) => t.locale === "vi"),
      en: cp.translations.find((t) => t.locale === "en"),
      tours: cp.tourLinks.map((tl) => ({
        tourId: tl.tour.id,
        slug: tl.tour.slug,
        order: tl.order,
      })),
    })),
  });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();
  const result = createCheckpointSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid input" },
      { status: 400 },
    );
  }

  const { slug, latitude, longitude, radiusMeters, estimatedVisitMinutes, sortOrderHint, priceVnd, priceKind, vi, en, guides } = result.data;

  try {
    const existing = await prisma.checkpoint.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Checkpoint already exists" },
        { status: 409 },
      );
    }

    const checkpoint = await prisma.checkpoint.create({
      data: {
        slug,
        latitude,
        longitude,
        radiusMeters,
        estimatedVisitMinutes,
        sortOrderHint,
        priceVnd,
        priceKind,
        translations: {
          create: [
            { locale: "vi", ...vi },
            { locale: "en", ...en },
          ],
        },
        guides: guides
          ? {
              create: guides.map((g) => ({
                locale: g.locale,
                sectionKey: g.sectionKey,
                title: g.title,
                content: g.contentType === "HTML" ? sanitizeHtml(g.content) : g.content,
                contentType: g.contentType,
                sortOrder: g.sortOrder,
              })),
            }
          : undefined,
      },
    });

    return NextResponse.json({ ok: true, checkpoint: { id: checkpoint.id, slug: checkpoint.slug } });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Checkpoint error or database error" },
      { status: 409 },
    );
  }
}