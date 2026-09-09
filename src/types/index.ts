import type { Locale } from "@/config/constants";

/** Shared view-model types returned by services & API routes (Plan.md §6). */

export type { Locale };

export type CheckpointStatus = "completed" | "current" | "locked";
export type TourStatus = "DRAFT" | "PUBLISHED";

export interface TourSummaryView {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  coverImageUrl: string;
  checkpointCount: number;
  /** Sum of checkpoint estimated visit minutes. */
  estimatedMinutes: number;
}

export interface TourCheckpointView {
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
  /** Present on tour detail/progress contexts; null when progress is unknown. */
  status: CheckpointStatus | null;
}

export interface TourDetailView extends TourSummaryView {
  checkpoints: TourCheckpointView[];
}

export type GuideSectionKey =
  | "introduction"
  | "history"
  | "culture"
  | "interesting_facts"
  | "travel_tips";

export interface GuideSectionView {
  sectionKey: GuideSectionKey;
  title: string;
  content: string;
}

export interface CheckpointDetailView {
  id: string;
  slug: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  estimatedVisitMinutes: number;
  name: string;
  summary: string;
  address: string;
  openingHours: string | null;
  bestTimeToVisit: string | null;
  thumbnailUrl: string | null;
  images: { url: string; alt: string | null }[];
  guides: GuideSectionView[];
}

export interface TourProgressView {
  tourSlug: string;
  completedCount: number;
  totalCount: number;
  percent: number;
  isCompleted: boolean;
  currentCheckpointId: string | null;
  checkpoints: {
    checkpointId: string;
    order: number;
    status: CheckpointStatus;
  }[];
}

export interface CheckInView {
  id: string;
  checkpointId: string;
  checkpointName: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  distanceFromCheckpoint: number;
  /** ISO 8601 timestamp. */
  checkedInAt: string;
}

export interface ShareLinkView {
  shareId: string;
  url: string;
  checkIn: CheckInView;
}

/** Data for the public share page /share/checkin/[shareId] (Plan.md §16). */
export interface SharePageView {
  shareId: string;
  /** ISO 8601 timestamp. */
  checkedInAt: string;
  checkpoint: {
    slug: string;
    name: string;
    address: string;
    thumbnailUrl: string | null;
  };
  tour: { slug: string; name: string } | null;
}

