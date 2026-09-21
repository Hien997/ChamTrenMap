import type { CheckpointStatus } from "@/types";

export interface MapCheckpoint {
  id: string;
  slug: string;
  order: number;
  name: string;
  summary: string;
  address: string;
  latitude: number;
  longitude: number;
  thumbnailUrl: string | null;
  estimatedVisitMinutes: number;
  status: CheckpointStatus;
}
