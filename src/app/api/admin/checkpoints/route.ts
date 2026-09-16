import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import {
  CheckpointWriteError,
  createCheckpointSchema,
} from "@/services/checkpoint-content";
import {
  createCheckpoint,
  listCheckpointsForAdmin,
} from "@/services/checkpoint-content.server";

function writeErrorResponse(error: unknown) {
  if (error instanceof CheckpointWriteError) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: error.status },
    );
  }
  throw error;
}

export async function GET() {
  await requireAdmin();
  const checkpoints = await listCheckpointsForAdmin();
  return NextResponse.json({ ok: true, checkpoints });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();
  const result = createCheckpointSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const checkpoint = await createCheckpoint(result.data);
    return NextResponse.json({ ok: true, checkpoint });
  } catch (error) {
    return writeErrorResponse(error);
  }
}
