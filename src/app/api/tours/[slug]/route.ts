import type { NextRequest } from "next/server";
import { apiError, apiOk, handleApiError, parseLocale } from "@/lib/api";
import { getTourDetail } from "@/services/tours.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const locale = parseLocale(request.nextUrl.searchParams);
    const tour = await getTourDetail(slug, locale);
    if (!tour) return apiError("NOT_FOUND", "Tour not found", 404);
    return apiOk(tour);
  } catch (error) {
    return handleApiError("GET /api/tours/[slug]", error);
  }
}
