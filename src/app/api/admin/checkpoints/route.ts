import type { NextRequest } from "next/server";
import {
  adminOk,
  parseAdminBody,
  parseAdminListQuery,
  writeErrorResponse,
} from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { createCheckpointSchema } from "@/services/checkpoint-content";
import {
  createCheckpoint,
  listCheckpointsForAdmin,
} from "@/services/checkpoint-content.server";

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const query = parseAdminListQuery(request.nextUrl.searchParams);
  if (!query.ok) return query.response;
  const { items, total } = await listCheckpointsForAdmin(query.data);
  return adminOk({ items, total });
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const parsed = parseAdminBody(createCheckpointSchema, await request.json());
  if (!parsed.ok) return parsed.response;

  try {
    const checkpoint = await createCheckpoint(parsed.data);
    return adminOk({ checkpoint });
  } catch (error) {
    return writeErrorResponse(error);
  }
}
