import { cn } from "@/lib/utils";
import type { CheckpointStatus } from "@/types";
import type { MapLocation } from "./map.types";
import type { MapCheckpoint } from "./types";

/** Z-order bands: locked pins sink, selection floats above every pin. */
const MARKER_Z = { selected: 30, normal: 20, locked: 5, user: 40 } as const;

/** Classes toggled on the pin circle when a marker is selected. */
const SELECTED_CLASSES = ["scale-125", "ring-2", "ring-primary/60"] as const;

const STATUS_TONES: Record<CheckpointStatus, string> = {
  completed: "bg-status-completed",
  current: "bg-status-current",
  locked: "bg-status-locked",
};

const STATUS_ICONS: Record<CheckpointStatus, string> = {
  completed:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
  current:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  locked:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
};

const DEFAULT_STATUS_LABELS: Record<CheckpointStatus, string> = {
  completed: "Completed",
  current: "Up next",
  locked: "Locked",
};

/**
 * A marker element plus in-place selection handling: callers consume the
 * interface instead of the DOM contract — no class or dataset queries.
 */
export interface MarkerElementHandle {
  element: HTMLElement;
  /** Base stacking order the map kit should honor. */
  zIndex: number;
  /** Toggle the selected look without recreating the element. */
  setSelected(selected: boolean): void;
}

/** DOM element for a tour checkpoint pin — status-toned circle + label (task §7). */
export function createCheckpointPin(
  checkpoint: MapCheckpoint,
  options?: {
    selected?: boolean;
    statusLabels?: Partial<Record<CheckpointStatus, string>>;
  },
): MarkerElementHandle {
  const status = checkpoint.status;
  const statusLabel =
    options?.statusLabels?.[status] ?? DEFAULT_STATUS_LABELS[status];
  const label = `${String(checkpoint.order).padStart(2, "0")}. ${checkpoint.name}`;
  const baseZ = status === "locked" ? MARKER_Z.locked : MARKER_Z.normal;

  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", `${label} — ${statusLabel}`);
  button.title = checkpoint.name;
  button.className =
    "flex cursor-pointer flex-col items-center border-0 bg-transparent p-0 focus-visible:outline-none";

  const circle = document.createElement("div");
  circle.className = cn(
    "map-pin-circle flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-white shadow-md transition-transform",
    STATUS_TONES[status],
  );
  circle.innerHTML = STATUS_ICONS[status];

  const labelDiv = document.createElement("div");
  labelDiv.className =
    "mt-1 max-w-[120px] truncate rounded-full bg-background/95 px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm";
  labelDiv.textContent = label;

  button.append(circle, labelDiv);

  const setSelected = (selected: boolean): void => {
    for (const className of SELECTED_CLASSES) {
      circle.classList.toggle(className, selected);
    }
    button.style.zIndex = String(selected ? MARKER_Z.selected : baseZ);
  };
  setSelected(options?.selected ?? false);

  return { element: button, zIndex: baseZ, setSelected };
}

/** Letter-circle pin for the homepage map (initial + name label). */
export function createHomePin(location: MapLocation): MarkerElementHandle {
  const baseZ = MARKER_Z.normal;

  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", location.name);
  button.title = location.name;
  button.className =
    "flex cursor-pointer flex-col items-center border-0 bg-transparent p-0 focus-visible:outline-none";

  const circle = document.createElement("div");
  circle.className =
    "map-pin-circle flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary text-xs font-semibold text-primary-foreground shadow-md transition-transform";
  circle.textContent = location.name.slice(0, 1).toUpperCase();

  const label = document.createElement("div");
  label.className =
    "mt-1 max-w-[120px] truncate rounded-full bg-background/95 px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm";
  label.textContent = location.name;

  button.append(circle, label);

  const setSelected = (selected: boolean): void => {
    for (const className of SELECTED_CLASSES) {
      circle.classList.toggle(className, selected);
    }
    button.style.zIndex = String(selected ? MARKER_Z.selected : baseZ);
  };
  setSelected(false);

  return { element: button, zIndex: baseZ, setSelected };
}

/** Kit default pin when no custom renderer is provided (task §7 "custom"). */
export function createDefaultPin(location: MapLocation): MarkerElementHandle {
  const element = document.createElement("div");
  element.title = location.name;
  element.className =
    "h-4 w-4 rounded-full border-2 border-white bg-primary shadow-md";

  const setSelected = (selected: boolean): void => {
    element.style.zIndex = String(
      selected ? MARKER_Z.selected : MARKER_Z.normal,
    );
  };
  setSelected(false);

  return { element, zIndex: MARKER_Z.normal, setSelected };
}

/** Pulsing blue dot for the user's position (same look as before). */
export function createUserLocationElement(): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("aria-label", "You");
  wrapper.className = "relative flex items-center justify-center";
  wrapper.style.zIndex = String(MARKER_Z.user);
  wrapper.innerHTML =
    '<span class="absolute h-6 w-6 animate-ping rounded-full bg-primary/50"></span>' +
    '<span class="relative h-4 w-4 rounded-full border-2 border-white bg-primary shadow"></span>';
  return wrapper;
}
