import type { NextRequest } from "next/server";
import { apiOk, handleApiError, parseLocale } from "@/lib/api";
import { listTours } from "@/services/tours.service";

export const GET = async (request: NextRequest) => {
  try {
    const locale = parseLocale(request.nextUrl.searchParams);
    return apiOk(await listTours(locale));
  } catch (error) {
    return handleApiError("GET /api/tours", error);
  }
};
