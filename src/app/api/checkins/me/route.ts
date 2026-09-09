import type { NextRequest } from "next/server";
import { apiOk, handleApiError } from "@/lib/api";
import { getOrCreateSessionUser } from "@/lib/session";
import { localeQuerySchema } from "@/lib/validations";
import { listMyCheckIns } from "@/services/checkins.service";

/** GET /api/checkins/me?locale=vi — the session user's check-ins (Plan.md §6). */
export async function GET(request: NextRequest) {
  try {
    const user = await getOrCreateSessionUser();
    const locale = localeQuerySchema.parse(
      request.nextUrl.searchParams.get("locale") ?? undefined,
    );
    return apiOk(await listMyCheckIns(user.id, locale));
  } catch (error) {
    return handleApiError("GET /api/checkins/me", error);
  }
}
