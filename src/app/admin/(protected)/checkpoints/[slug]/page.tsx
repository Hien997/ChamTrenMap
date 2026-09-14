import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CheckpointEditForm from "@/components/admin/CheckpointEditForm";

export const dynamic = "force-dynamic";

type TGuide = {
  id?: string;
  sectionKey: string;
  locale: string;
  title: string;
  content: string;
  contentType: "TEXT" | "HTML";
  sortOrder: number;
};

type TCheckpoint = {
  id: string;
  slug: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  estimatedVisitMinutes: number;
  sortOrderHint: number;
  priceVnd: number | null;
  priceKind: "TICKET" | "FOOD";
  vi: { name: string; summary: string; address: string; openingHours?: string | null; bestTimeToVisit?: string | null } | null;
  en: { name: string; summary: string; address: string; openingHours?: string | null; bestTimeToVisit?: string | null } | null;
  guides: TGuide[];
};

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
    guides: cp.guides.map((g) => ({
      id: g.id,
      sectionKey: g.sectionKey,
      locale: g.locale,
      title: g.title,
      content: g.content,
      contentType: g.contentType as "TEXT" | "HTML",
      sortOrder: g.sortOrder,
    })),
  };

  return <CheckpointEditForm checkpoint={checkpoint} />;
}