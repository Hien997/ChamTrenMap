import type { NextRequest } from "next/server";
import { apiError, apiOk, handleApiError } from "@/lib/api";
import { getOrCreateSessionUser } from "@/lib/session";
import { createShareLinkSchema } from "@/lib/validations";
import { createShareLink } from "@/services/share.service";

export async function POST(request: NextRequest) {
  try {
    const parsed = createShareLinkSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("BAD_REQUEST", "Invalid request body", 400, {
        issues: parsed.error.issues,
      });
    }

    const user = await getOrCreateSessionUser();
    const origin =
      process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const result = await createShareLink(user.id, parsed.data.checkInId, origin);

    switch (result.status) {
      case "ok":
        return apiOk({ shareId: result.shareId, url: result.url });
      case "not_found":
        return apiError("NOT_FOUND", "Check-in not found", 404);
      case "forbidden":
        return apiError("UNAUTHORIZED", "Not your check-in", 403);
    }
  } catch (error) {
    return handleApiError("POST /api/share/checkin", error);
  }
}
