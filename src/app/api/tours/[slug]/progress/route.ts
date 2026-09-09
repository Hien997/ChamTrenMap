import type { NextRequest } from "next/server";
import { apiError, apiOk, handleApiError } from "@/lib/api";
import { getOrCreateSessionUser } from "@/lib/session";
import { buildProgressView } from "@/services/progress.service";

/** GET /api/tours/[slug]/progress — session progress on a tour (Plan.md §6). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const user = await getOrCreateSessionUser();
    const progress = await buildProgressView(user.id, slug);
    if (!progress) return apiError("NOT_FOUND", "Tour not found", 404);
    return apiOk(progress);
  } catch (error) {
    return handleApiError("GET /api/tours/[slug]/progress", error);
  }
}
