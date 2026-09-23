"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";
import {
  BackLink,
  Field,
  PageHeader,
  Panel,
  RequiredNote,
  StatusChip,
} from "./ui";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatApiError,
  toFieldErrors,
  type AdminWriteResponse,
} from "@/lib/admin-form";
import { updateTourSchema } from "@/lib/validations/admin";
import { InputField } from "../form";

type TCheckpointOption = {
  id: string;
  slug: string;
  name: string;
};

type TTour = {
  id: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  vi: {
    name: string;
    tagline: string;
    description: string;
    coverImageUrl?: string | null;
  } | null;
  en: {
    name: string;
    tagline: string;
    description: string;
    coverImageUrl?: string | null;
  } | null;
  checkpoints: { checkpointId: string; slug: string; name: string }[];
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
  stop: TCheckpointOption;
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

export default function AdminTourEditPage({
  tour,
  availableCheckpoints,
}: {
  tour: TTour;
  availableCheckpoints: TCheckpointOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const vi = tour.vi || { name: "", tagline: "", description: "" };
  const en = tour.en || { name: "", tagline: "", description: "" };

  // Stops live in component state so the order can be edited before saving;
  // the array order *is* the visit order sent to the API.
  const [stopIds, setStopIds] = useState<string[]>(() =>
    tour.checkpoints.map((stop) => stop.checkpointId),
  );

  // A stop already on the tour is always in `availableCheckpoints`, but falling
  // back to the tour's own data keeps the row renderable if it ever is not.
  const stopInfo = new Map<string, TCheckpointOption>();
  for (const checkpoint of availableCheckpoints)
    stopInfo.set(checkpoint.id, checkpoint);
  for (const stop of tour.checkpoints) {
    if (!stopInfo.has(stop.checkpointId)) {
      stopInfo.set(stop.checkpointId, {
        id: stop.checkpointId,
        slug: stop.slug,
        name: stop.name,
      });
    }
  }

  const remainingCheckpoints = availableCheckpoints.filter(
    (checkpoint) => !stopIds.includes(checkpoint.id),
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
    setStopIds((current) => {
      const from = current.indexOf(String(active.id));
      const to = current.indexOf(String(over.id));
      if (from < 0 || to < 0) return current;
      return arrayMove(current, from, to);
    });
  };

  const removeStop = (id: string) =>
    setStopIds((current) => current.filter((stopId) => stopId !== id));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    const formData = new FormData(e.currentTarget);

    const payload = {
      id: tour.id,
      status: formData.get("status") as "DRAFT" | "PUBLISHED",
      vi: {
        name: formData.get("vi.name") as string,
        tagline: formData.get("vi.tagline") as string,
        description: formData.get("vi.description") as string,
        coverImageUrl: formData.get("vi.coverImageUrl") as string,
      },
      en: {
        name: formData.get("en.name") as string,
        tagline: formData.get("en.tagline") as string,
        description: formData.get("en.description") as string,
        coverImageUrl: formData.get("en.coverImageUrl") as string,
      },
      checkpointIds: stopIds,
    };

    // Client-side validation
    const parsed = updateTourSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(
        toFieldErrors(
          parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        ),
      );
      toast.error("Please fix the errors in the form.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/tours/${tour.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json: AdminWriteResponse = await res.json();
        if (json.ok) {
          toast.success("Tour saved successfully!");
          router.push("/admin/tours");
        } else {
          toast.error(formatApiError(json.error, json.details));
          setErrors(toFieldErrors(json.details));
        }
      } catch {
        toast.error("Network error. Please try again.");
      }
    });
  };

  return (
    <div>
      <BackLink href="/admin/tours">Back to tours</BackLink>
      <PageHeader
        title={vi.name || tour.slug}
        sub={`/${tour.slug}`}
        actions={<StatusChip status={tour.status} />}
      />
      <RequiredNote />

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <Panel title="Status">
          <div className="max-w-48">
            <Field
              label="Publication status"
              htmlFor="status"
              error={errors.status}
            >
              <Select name="status" defaultValue={tour.status}>
                <SelectTrigger id="status" aria-invalid={!!errors.status}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Tiếng Việt (vi)">
            <div className="space-y-4">
              <InputField name="vi.name" label="Name" required />

              <Field
                label="Tagline"
                htmlFor="vi.tagline"
                error={errors["vi.tagline"]}
              >
                <Input
                  id="vi.tagline"
                  name="vi.tagline"
                  defaultValue={vi.tagline}
                  required
                  aria-invalid={!!errors["vi.tagline"]}
                />
              </Field>
              <Field
                label="Description"
                htmlFor="vi.description"
                error={errors["vi.description"]}
              >
                <Textarea
                  id="vi.description"
                  name="vi.description"
                  defaultValue={vi.description}
                  rows={4}
                  required
                  aria-invalid={!!errors["vi.description"]}
                />
              </Field>
              <Field
                label="Cover image URL"
                htmlFor="vi.coverImageUrl"
                error={errors["vi.coverImageUrl"]}
              >
                <Input
                  id="vi.coverImageUrl"
                  name="vi.coverImageUrl"
                  type="url"
                  defaultValue={vi.coverImageUrl || ""}
                  autoComplete="off"
                  aria-invalid={!!errors["vi.coverImageUrl"]}
                />
              </Field>
            </div>
          </Panel>

          <Panel title="English (en)">
            <div className="space-y-4">
              <Field
                label="Name"
                htmlFor="en.name"
                error={errors["en.name"]}
                required
              >
                <Input
                  id="en.name"
                  name="en.name"
                  defaultValue={en.name}
                  required
                  aria-invalid={!!errors["en.name"]}
                />
              </Field>
              <Field
                label="Tagline"
                htmlFor="en.tagline"
                error={errors["en.tagline"]}
              >
                <Input
                  id="en.tagline"
                  name="en.tagline"
                  defaultValue={en.tagline}
                  required
                  aria-invalid={!!errors["en.tagline"]}
                />
              </Field>
              <Field
                label="Description"
                htmlFor="en.description"
                error={errors["en.description"]}
              >
                <Textarea
                  id="en.description"
                  name="en.description"
                  defaultValue={en.description}
                  rows={4}
                  required
                  aria-invalid={!!errors["en.description"]}
                />
              </Field>
              <Field
                label="Cover image URL"
                htmlFor="en.coverImageUrl"
                error={errors["en.coverImageUrl"]}
              >
                <Input
                  id="en.coverImageUrl"
                  name="en.coverImageUrl"
                  type="url"
                  defaultValue={en.coverImageUrl || ""}
                  autoComplete="off"
                  aria-invalid={!!errors["en.coverImageUrl"]}
                />
              </Field>
            </div>
          </Panel>
        </div>

        <Panel title={`Stops on this tour (${stopIds.length})`}>
          {stopIds.length === 0 ? (
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
                items={stopIds}
                strategy={verticalListSortingStrategy}
              >
                <ol className="flex flex-col gap-2">
                  {stopIds.map((id, index) => {
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
            <Combobox<TCheckpointOption>
              items={remainingCheckpoints}
              value={null}
              onValueChange={(checkpoint) => {
                if (!checkpoint) return;
                setStopIds((current) =>
                  current.includes(checkpoint.id)
                    ? current
                    : [...current, checkpoint.id],
                );
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
                aria-invalid={!!errors.checkpointIds}
              />
              <ComboboxContent>
                <ComboboxCollection>
                  {(checkpoint: TCheckpointOption) => (
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

          {errors.checkpointIds ? (
            <p className="mt-3 text-xs text-destructive" aria-live="polite">
              {errors.checkpointIds}
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Drag the grip to reorder, or focus it and use the arrow keys. Save
              changes to apply.
            </p>
          )}
        </Panel>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
