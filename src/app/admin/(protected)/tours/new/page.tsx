import TourNewForm from "@/components/admin/TourNewForm";
import { listCheckpointOptions } from "@/services/checkpoints.service";

export const dynamic = "force-dynamic";

export default async function AdminTourNewPage() {
  const availableCheckpoints = await listCheckpointOptions();

  return <TourNewForm availableCheckpoints={availableCheckpoints} />;
}
