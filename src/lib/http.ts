import { NextResponse } from "next/server";

import { CheckpointWriteError } from "@/services/checkpoint-content";

export function writeErrorResponse(error: unknown) {
  if (error instanceof CheckpointWriteError) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: error.status },
    );
  }
  throw error;
}
