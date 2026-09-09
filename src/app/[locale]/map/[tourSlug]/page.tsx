import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { MapExperience } from "@/components/map/MapExperience";
import type { Locale } from "@/config/constants";
import { getTourDetail } from "@/services/tours.service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; tourSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, tourSlug } = await params;
  const tour = await getTourDetail(tourSlug, locale as Locale);
  return { title: `${tour?.name ?? "Map"} — Chàm Trên Map` };
}

export default async function TourMapPage({ params }: Props) {
  const { locale, tourSlug } = await params;
  setRequestLocale(locale);
  return <MapExperience tourSlug={tourSlug} locale={locale} />;
}
