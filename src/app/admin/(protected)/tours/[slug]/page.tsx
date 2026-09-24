import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TourEditForm from "@/components/admin/TourEditForm";
import { listCheckpointOptions } from "@/services/checkpoints.service";

type TTourStop = {
  /** `Checkpoint.id` — what the PATCH route stores in `TourCheckpoint`. */
  checkpointId: string;
  slug: string;
  name: string;
};

type TTour = {
  id: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  vi: { name: string; tagline: string; description: string; coverImageUrl?: string | null } | null;
  en: { name: string; tagline: string; description: string; coverImageUrl?: string | null } | null;
  checkpoints: TTourStop[];
};

export const dynamic = "force-dynamic";

export default async function AdminTourEditPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [tour, availableCheckpoints] = await Promise.all([
    prisma.tour.findUnique({
      where: { slug },
      include: {
        translations: true,
        checkpoints: {
          orderBy: { order: "asc" },
          include: { checkpoint: { include: { translations: true } } },
        },
      },
    }),
    listCheckpointOptions(),
  ]);

  if (!tour) notFound();

  const vi = tour.translations.find((t) => t.locale === "vi");
  const en = tour.translations.find((t) => t.locale === "en");

  const typedTour: TTour = {
    id: tour.id,
    slug: tour.slug,
    status: tour.status as "DRAFT" | "PUBLISHED",
    vi: vi
      ? {
          name: vi.name,
          tagline: vi.tagline,
          description: vi.description,
          coverImageUrl: vi?.coverImageUrl ?? null,
        }
      : null,
    en: en
      ? {
          name: en.name,
          tagline: en.tagline,
          description: en.description,
          coverImageUrl: en?.coverImageUrl ?? null,
        }
      : null,
    checkpoints: tour.checkpoints.map((tc) => ({
      checkpointId: tc.checkpoint.id,
      slug: tc.checkpoint.slug,
      name:
        tc.checkpoint.translations.find((t) => t.locale === "vi")?.name ||
        tc.checkpoint.slug,
    })),
  };

  return (
    <TourEditForm tour={typedTour} availableCheckpoints={availableCheckpoints} />
  );
}