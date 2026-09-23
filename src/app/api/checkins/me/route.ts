import type { NextRequest } from "next/server";
import { apiOk, handleApiError, parseLocale } from "@/lib/api";
import { getSessionVisitor } from "@/lib/visitor-session";
import { listMyCheckIns } from "@/services/checkins.service";

export async function GET(request: NextRequest) {
  try {
    // Write-lazy: no visitor row yet means no check-ins — never create rows here.
    const user = await getSessionVisitor();
    const locale = parseLocale(request.nextUrl.searchParams);
    if (!user) return apiOk([]);
    return apiOk(await listMyCheckIns(user.id, locale));
  } catch (error) {
    return handleApiError("GET /api/checkins/me", error);
  }
}
