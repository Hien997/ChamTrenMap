import type { NextRequest } from "next/server";
import { apiError, apiOk, handleApiError } from "@/lib/api";
import { localeQuerySchema } from "@/lib/validations";
import { getCheckpointDetail } from "@/services/checkpoints.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const locale = localeQuerySchema.parse(
      request.nextUrl.searchParams.get("locale") ?? undefined,
    );
    const checkpoint = await getCheckpointDetail(slug, locale);
    if (!checkpoint) return apiError("NOT_FOUND", "Checkpoint not found", 404);
    return apiOk(checkpoint);
  } catch (error) {
    return handleApiError("GET /api/checkpoints/[slug]", error);
  }
}
