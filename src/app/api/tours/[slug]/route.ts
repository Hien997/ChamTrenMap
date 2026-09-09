import type { NextRequest } from "next/server";
import { apiError, apiOk, handleApiError } from "@/lib/api";
import { localeQuerySchema } from "@/lib/validations";
import { getTourDetail } from "@/services/tours.service";

/** GET /api/tours/[slug]?locale=vi — tour detail with ordered checkpoints. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const locale = localeQuerySchema.parse(
      request.nextUrl.searchParams.get("locale") ?? undefined,
    );
    const tour = await getTourDetail(slug, locale);
    if (!tour) return apiError("NOT_FOUND", "Tour not found", 404);
    return apiOk(tour);
  } catch (error) {
    return handleApiError("GET /api/tours/[slug]", error);
  }
}
