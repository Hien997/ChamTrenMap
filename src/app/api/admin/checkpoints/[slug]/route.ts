import type { NextRequest } from "next/server";
import {
  adminError,
  adminOk,
  parseAdminBody,
  writeErrorResponse,
} from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { updateCheckpointSchema } from "@/services/checkpoint-content";
import {
  deleteCheckpoint,
  getCheckpointForEdit,
  updateCheckpoint,
} from "@/services/checkpoint-content.server";

function slugFromRequest(request: NextRequest): string {
  const { pathname } = new URL(request.url);
  return pathname.split("/").pop() ?? "";
}

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const checkpoint = await getCheckpointForEdit(slugFromRequest(request));
  if (!checkpoint) {
    return adminError("Not found", 404);
  }
  return adminOk({ checkpoint });
}

export async function PATCH(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const parsed = parseAdminBody(updateCheckpointSchema, await request.json());
  if (!parsed.ok) return parsed.response;

  try {
    const checkpoint = await updateCheckpoint(
      slugFromRequest(request),
      parsed.data,
    );
    return adminOk({ checkpoint });
  } catch (error) {
    return writeErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  try {
    await deleteCheckpoint(slugFromRequest(request));
    return adminOk();
  } catch (error) {
    return writeErrorResponse(error);
  }
}
