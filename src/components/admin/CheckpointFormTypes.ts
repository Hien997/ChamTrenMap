export type TGuide = {
  id?: string;
  locale: "vi" | "en";
  content: string;
  contentType: "TEXT" | "HTML";
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
