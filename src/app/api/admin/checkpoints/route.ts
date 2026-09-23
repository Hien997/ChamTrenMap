import type { NextRequest} from "next/server";
import { adminOk, parseAdminBody, writeErrorResponse } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { createCheckpointSchema } from "@/services/checkpoint-content";
import {
  createCheckpoint,
  listCheckpointsForAdmin,
} from "@/services/checkpoint-content.server";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const checkpoints = await listCheckpointsForAdmin();
  return adminOk({ checkpoints });
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
