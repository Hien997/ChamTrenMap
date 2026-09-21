import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { writeErrorResponse } from "@/lib/http";
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
  await requireAdmin();
  const checkpoint = await getCheckpointForEdit(slugFromRequest(request));
  if (!checkpoint) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, checkpoint });
}

export async function PATCH(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();
  const result = updateCheckpointSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const checkpoint = await updateCheckpoint(
      slugFromRequest(request),
      result.data,
    );
    return NextResponse.json({ ok: true, checkpoint });
  } catch (error) {
    return writeErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  await requireAdmin();
  try {
    await deleteCheckpoint(slugFromRequest(request));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return writeErrorResponse(error);
  }
}
