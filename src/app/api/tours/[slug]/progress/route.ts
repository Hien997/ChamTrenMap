import type { NextRequest } from "next/server";
import { apiError, apiOk, handleApiError } from "@/lib/api";
import { getSessionVisitor } from "@/lib/visitor-session";
import { buildProgressView } from "@/services/progress.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    // Read-only lookup; an id that matches nothing yields a zeroed view for
    // visitors who have not checked in yet (write-lazy, ADR-0001).
    const user = await getSessionVisitor();
    const progress = await buildProgressView(user?.id ?? "", slug);
    if (!progress) return apiError("NOT_FOUND", "Tour not found", 404);
    return apiOk(progress);
  } catch (error) {
    return handleApiError("GET /api/tours/[slug]/progress", error);
  }
}
