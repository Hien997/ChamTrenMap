import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { writeErrorResponse } from "@/lib/http";
import { createCheckpointSchema } from "@/services/checkpoint-content";
import {
  createCheckpoint,
  listCheckpointsForAdmin,
} from "@/services/checkpoint-content.server";

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
