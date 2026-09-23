import type { NextRequest } from "next/server";
import { apiError, apiOk, handleApiError, parseBody } from "@/lib/api";
import { getSessionVisitor } from "@/lib/visitor-session";
import { createShareLinkSchema } from "@/lib/validations";
import { createShareLink } from "@/services/share.service";

export async function POST(request: NextRequest) {
  try {
    const parsed = parseBody(createShareLinkSchema, await request.json());
    if (!parsed.ok) return parsed.response;

    // Read-only: sharing requires an existing visitor who owns the check-in.
    const user = await getSessionVisitor();
    if (!user) return apiError("UNAUTHORIZED", "Not your check-in", 403);
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
