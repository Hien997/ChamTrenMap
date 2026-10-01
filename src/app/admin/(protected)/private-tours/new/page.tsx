import PrivateTourNewForm from "@/components/admin/PrivateTourNewForm";
import { listCheckpointOptions } from "@/services/checkpoints.service";

export const dynamic = "force-dynamic";

const AdminPrivateTourNewPage = async () => {
  const availableCheckpoints = await listCheckpointOptions();

  return <PrivateTourNewForm availableCheckpoints={availableCheckpoints} />;
};

export default AdminPrivateTourNewPage;
