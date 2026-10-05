import { notFound } from "next/navigation";
import PrivateTourEditForm from "@/components/admin/PrivateTourEditForm";
import { listCheckpointOptions } from "@/services/checkpoints.service";
import { getPrivateTourForAdmin } from "@/services/private-tours.service";
import type { PrivateTourStatus } from "@/types";

export const dynamic = "force-dynamic";

const AdminPrivateTourEditPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const [tour, availableCheckpoints] = await Promise.all([
    getPrivateTourForAdmin(id),
    listCheckpointOptions(),
  ]);

  if (!tour) {
    notFound();
  }

  const vi = tour.translations.find((t) => t.locale === "vi");
  const en = tour.translations.find((t) => t.locale === "en");

  return (
    <PrivateTourEditForm
      tour={{
        id: tour.id,
        code: tour.code,
        status: tour.status as PrivateTourStatus,
        customerName: tour.customerName,
        customerPhone: tour.customerPhone,
        maxSlots: tour.maxSlots,
        startsAt: tour.startsAt?.toISOString() ?? null,
        expiresAt: tour.expiresAt?.toISOString() ?? null,
        vi: {
          name: vi?.name ?? tour.code,
          tagline: vi?.tagline ?? "",
          description: vi?.description ?? "",
          coverImageUrl: vi?.coverImageUrl ?? "",
        },
        en: en
          ? {
              name: en.name,
              tagline: en.tagline,
              description: en.description,
              coverImageUrl: en.coverImageUrl,
            }
          : null,
        checkpointIds: tour.stops.map((stop) => stop.checkpointId),
      }}
      availableCheckpoints={availableCheckpoints}
    />
  );
};

export default AdminPrivateTourEditPage;
