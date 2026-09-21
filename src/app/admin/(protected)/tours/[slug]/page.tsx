import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TourEditForm from "@/components/admin/TourEditForm";

type TTour = {
  id: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  vi: { name: string; tagline: string; description: string; coverImageUrl?: string | null } | null;
  en: { name: string; tagline: string; description: string; coverImageUrl?: string | null } | null;
  checkpoints: { id: string; slug: string; name: string; order: number }[];
};

export const dynamic = "force-dynamic";

export default async function AdminTourEditPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

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
      id: tc.id,
      slug: tc.checkpoint.slug,
      name:
        tc.checkpoint.translations.find((t) => t.locale === "vi")?.name ||
        tc.checkpoint.slug,
      order: tc.order,
    })),
  };

  return <TourEditForm tour={typedTour} />;
}