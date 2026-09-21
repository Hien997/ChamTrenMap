import type { NextRequest } from "next/server";
import { apiOk, handleApiError } from "@/lib/api";
import { localeQuerySchema } from "@/lib/validations";
import { listTours } from "@/services/tours.service";

export async function GET(request: NextRequest) {
  try {
    const locale = localeQuerySchema.parse(
      request.nextUrl.searchParams.get("locale") ?? undefined,
    );
    return apiOk(await listTours(locale));
  } catch (error) {
    return handleApiError("GET /api/tours", error);
  }
}
