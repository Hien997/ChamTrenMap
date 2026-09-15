import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CheckpointEditForm from "@/components/admin/CheckpointEditForm";
import type { TCheckpoint, TGuide } from "@/components/admin/CheckpointFormTypes";

export const dynamic = "force-dynamic";

export default async function AdminCheckpointEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const cp = await prisma.checkpoint.findUnique({
    where: { slug },
    include: {
      translations: true,
      guides: true,
    },
  });

  if (!cp) notFound();

  const checkpoint: TCheckpoint = {
    id: cp.id,
    slug: cp.slug,
    latitude: cp.latitude,
    longitude: cp.longitude,
    radiusMeters: cp.radiusMeters,
    estimatedVisitMinutes: cp.estimatedVisitMinutes,
    sortOrderHint: cp.sortOrderHint,
    priceVnd: cp.priceVnd,
    priceKind: cp.priceKind === "FOOD" ? "FOOD" : "TICKET",
    vi: (() => {
      const t = cp.translations.find((t) => t.locale === "vi");
      return t
        ? {
            name: t.name,
            summary: t.summary,
            address: t.address,
            openingHours: t.openingHours,
            bestTimeToVisit: t.bestTimeToVisit,
          }
        : null;
    })(),
    en: (() => {
      const t = cp.translations.find((t) => t.locale === "en");
      return t
        ? {
            name: t.name,
            summary: t.summary,
            address: t.address,
            openingHours: t.openingHours,
            bestTimeToVisit: t.bestTimeToVisit,
          }
        : null;
    })(),
    guides: cp.guides.map(
      (g): TGuide => ({
        id: g.id,
        // The DB column is a plain String; narrow it to the shared union so the
        // edit form's guide keys stay type-checked end to end.
        sectionKey: g.sectionKey as TGuide["sectionKey"],
        locale: g.locale as TGuide["locale"],
        title: g.title,
        content: g.content,
        contentType: g.contentType,
        sortOrder: g.sortOrder,
      }),
    ),
  };

  return <CheckpointEditForm checkpoint={checkpoint} />;
}