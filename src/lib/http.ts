import { NextResponse } from "next/server";

import { CheckpointWriteError } from "@/services/checkpoint-content";

/**
 * Map a domain write error onto the JSON error envelope used by the admin
 * routes; anything else is rethrown so Next renders its default 500.
 */
export function writeErrorResponse(error: unknown) {
  if (error instanceof CheckpointWriteError) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: error.status },
    );
  }
  throw error;
}
