export const GUIDE_KEYS = [
  { key: "introduction", label: "Introduction" },
  { key: "history", label: "History" },
  { key: "culture", label: "Culture" },
  { key: "interesting_facts", label: "Interesting Facts" },
  { key: "travel_tips", label: "Travel Tips" },
] as const;

export type TGuide = {
  id?: string;
  sectionKey: string;
  locale: string;
  title: string;
  content: string;
  contentType: "TEXT" | "HTML";
  sortOrder: number;
};

export type TTranslation = {
  name: string;
  summary: string;
  address: string;
  openingHours?: string | null;
  bestTimeToVisit?: string | null;
};

export type TCheckpoint = {
  id: string;
  slug: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  estimatedVisitMinutes: number;
  sortOrderHint: number;
  priceVnd: number | null;
  priceKind: "TICKET" | "FOOD";
  vi: TTranslation | null;
  en: TTranslation | null;
  guides: TGuide[];
};