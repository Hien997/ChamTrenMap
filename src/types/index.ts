import type { Locale } from "@/config/constants";

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
  status: CheckpointStatus | null;
}

export interface TourDetailView extends TourSummaryView {
  checkpoints: TourCheckpointView[];
}

export interface GuideSectionView {
  locale: "vi" | "en";
  content: string;
  contentType: "TEXT" | "HTML";
}

export interface CheckpointDetailView {
  id: string;
  slug: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  estimatedVisitMinutes: number;
  priceVnd: number | null;
  priceKind: "ticket" | "food";
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
  checkedInAt: string;
}

export interface ShareLinkView {
  shareId: string;
  url: string;
  checkIn: CheckInView;
}

export interface SharePageView {
  shareId: string;
  checkedInAt: string;
  checkpoint: {
    slug: string;
    name: string;
    address: string;
    thumbnailUrl: string | null;
  };
  tour: { slug: string; name: string } | null;
}
