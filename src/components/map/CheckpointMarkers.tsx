"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { cn } from "@/lib/utils";
import type { CheckpointStatus } from "@/types";
import type { MapCheckpoint } from "./types";

const PINS: Record<
  CheckpointStatus,
  { emoji: string; className: string }
> = {
  completed: { emoji: "✅", className: "bg-emerald-500" },
  current: { emoji: "⭐", className: "bg-amber-400" },
  locked: { emoji: "🔒", className: "bg-slate-400" },
};

/** Status markers: ✅ completed · ⭐ current · 🔒 locked (Plan.md §10). */
export function CheckpointMarkers({
  checkpoints,
  selectedId,
  onSelect,
}: {
  checkpoints: MapCheckpoint[];
  selectedId: string | null;
  onSelect: (checkpoint: MapCheckpoint) => void;
}) {
  return (
    <>
      {checkpoints.map((checkpoint) => {
        const pin = PINS[checkpoint.status];
        const selected = checkpoint.id === selectedId;
        return (
          <AdvancedMarker
            key={checkpoint.id}
            position={{ lat: checkpoint.latitude, lng: checkpoint.longitude }}
            title={checkpoint.name}
            zIndex={selected ? 30 : checkpoint.status === "locked" ? 5 : 20}
            onClick={() => onSelect(checkpoint)}
          >
            <div className="flex cursor-pointer flex-col items-center">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-lg shadow-md transition-transform",
                  pin.className,
                  selected && "scale-125 ring-2 ring-primary/60",
                )}
              >
                {pin.emoji}
              </div>
              <div className="mt-1 max-w-[120px] truncate rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-slate-800 shadow">
                {String(checkpoint.order).padStart(2, "0")} · {checkpoint.name}
              </div>
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
}
