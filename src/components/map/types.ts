import type { CheckpointStatus } from "@/types";

/** A checkpoint as rendered on the tour map (status merged from progress). */
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
