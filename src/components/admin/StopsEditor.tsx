"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";

/** A checkpoint as offered by the tour stop picker (id + display fields). */
export type CheckpointOption = {
  id: string;
  slug: string;
  name: string;
};

/**
 * One draggable stop row. Lives at module scope (not inside the form) so
 * React keeps a stable component type across renders — an inline definition
 * would remount every row on each keystroke/drag and reset the drag gesture.
 *
 * Drag rows into a new visit order; the row order *is* the saved order.
 */
function StopRow({
  stop,
  index,
  onRemove,
}: {
  stop: CheckpointOption;
  index: number;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-md border bg-background/60 px-3 py-2 ${
        isDragging ? "z-10 shadow-md" : ""
      }`}
    >
      {/* The grip owns the drag sensor: the rest of the row stays clickable.
          Keyboard drag works out of the box through the same listeners, plus
          the Space key lifts and the arrow keys move the row. */}
      <button
        type="button"
        {...listeners}
        {...attributes}
        aria-label={`Reorder ${stop.name} — drag, or press Space then use the arrow keys`}
        className="cursor-grab touch-none rounded p-0.5 text-muted-foreground/60 hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing"
      >
        <GripVerticalIcon aria-hidden className="size-4" />
      </button>
      <span className="w-5 shrink-0 text-sm tabular-nums text-muted-foreground">
        {index + 1}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">{stop.name}</span>
      <span className="hidden text-xs text-muted-foreground sm:inline">
        /{stop.slug}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(stop.id)}
        aria-label={`Remove ${stop.name} from this tour`}
      >
        <XIcon aria-hidden className="size-4 text-destructive" />
      </Button>
    </li>
  );
}

/**
 * Controlled stop list for a tour form: drag-to-reorder rows plus a combobox
 * to add more. Pure presentation — the order lives with the caller
 * (react-hook-form on create, component state on edit) and arrives back as a
 * whole new array via `onChange`.
 */
export default function StopsEditor({
  value,
  onChange,
  availableCheckpoints,
  extraOptions = [],
  error,
  hint = "Drag the grip to reorder, or focus it and use the arrow keys.",
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  availableCheckpoints: CheckpointOption[];
  /** Stops already on the tour that may be missing from `availableCheckpoints`. */
  extraOptions?: CheckpointOption[];
  error?: string;
  hint?: string;
}) {
  // A stop already on the tour is always in `availableCheckpoints`, but falling
  // back to the caller's rows keeps it renderable if it ever is not.
  const stopInfo = new Map<string, CheckpointOption>();
  for (const checkpoint of availableCheckpoints)
    stopInfo.set(checkpoint.id, checkpoint);
  for (const stop of extraOptions) {
    if (!stopInfo.has(stop.id)) stopInfo.set(stop.id, stop);
  }

  const remainingCheckpoints = availableCheckpoints.filter(
    (checkpoint) => !value.includes(checkpoint.id),
  );

  // Pointer drags start after a small movement so clicks still land on the
  // row; the keyboard sensor mirrors the same gesture with Space + arrows.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // dnd-kit reports which id landed where; the array order *is* the visit
  // order, so one arrayMove here is the whole reorder.
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = value.indexOf(String(active.id));
    const to = value.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onChange(arrayMove(value, from, to));
  };

  const removeStop = (id: string) =>
    onChange(value.filter((stopId) => stopId !== id));

  return (
    <>
      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No stops yet. Add checkpoints below — visitors walk them in the
          order listed here.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={value}
            strategy={verticalListSortingStrategy}
          >
            <ol className="flex flex-col gap-2">
              {value.map((id, index) => {
                const stop = stopInfo.get(id);
                if (!stop) return null;
                return (
                  <StopRow
                    key={id}
                    stop={stop}
                    index={index}
                    onRemove={removeStop}
                  />
                );
              })}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      <div className="mt-4 space-y-1.5">
        <Label>Add a stop</Label>
        <Combobox<CheckpointOption>
          items={remainingCheckpoints}
          value={null}
          onValueChange={(checkpoint) => {
            if (!checkpoint) return;
            if (!value.includes(checkpoint.id))
              onChange([...value, checkpoint.id]);
          }}
          itemToStringLabel={(checkpoint) => checkpoint?.name ?? ""}
          isItemEqualToValue={(a, b) => (a?.id ?? null) === (b?.id ?? null)}
        >
          <ComboboxInput
            placeholder={
              remainingCheckpoints.length === 0
                ? "Every checkpoint is already on this tour"
                : "Search checkpoints by name or slug…"
            }
            disabled={remainingCheckpoints.length === 0}
            autoComplete="off"
            aria-invalid={!!error}
          />
          <ComboboxContent>
            <ComboboxCollection>
              {(checkpoint: CheckpointOption) => (
                <ComboboxItem key={checkpoint.id} value={checkpoint}>
                  <span className="min-w-0 flex-1 truncate">
                    {checkpoint.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    /{checkpoint.slug}
                  </span>
                </ComboboxItem>
              )}
            </ComboboxCollection>
            <ComboboxEmpty>No checkpoints match that search.</ComboboxEmpty>
          </ComboboxContent>
        </Combobox>
      </div>

      {error ? (
        <p className="mt-3 text-xs text-destructive" aria-live="polite">
          {error}
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
      )}
    </>
  );
}