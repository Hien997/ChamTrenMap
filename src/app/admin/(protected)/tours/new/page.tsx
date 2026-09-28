import TourNewForm from "@/components/admin/TourNewForm";
import { listCheckpointOptions } from "@/services/checkpoints.service";

export const dynamic = "force-dynamic";

const AdminTourNewPage = async () => {
  const availableCheckpoints = await listCheckpointOptions();

  return <TourNewForm availableCheckpoints={availableCheckpoints} />;
};

export default AdminTourNewPage;
