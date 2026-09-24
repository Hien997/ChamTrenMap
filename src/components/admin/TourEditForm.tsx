"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BackLink,
  Field,
  PageHeader,
  Panel,
  RequiredNote,
  StatusChip,
} from "./ui";
import StopsEditor, { type CheckpointOption } from "./StopsEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function AdminTourEditPage({
  tour,
  availableCheckpoints,
}: {
  tour: TTour;
  availableCheckpoints: CheckpointOption[];
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

  // Rows the picker may not know about (e.g. a stop missing from
  // `availableCheckpoints`) still need slug/name to render.
  const extraStopOptions = tour.checkpoints.map((stop) => ({
    id: stop.checkpointId,
    slug: stop.slug,
    name: stop.name,
  }));

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
              <Field
                label="Name"
                htmlFor="vi.name"
                error={errors["vi.name"]}
                required
              >
                <Input
                  id="vi.name"
                  name="vi.name"
                  defaultValue={vi.name}
                  required
                  aria-invalid={!!errors["vi.name"]}
                />
              </Field>

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
          <StopsEditor
            value={stopIds}
            onChange={setStopIds}
            availableCheckpoints={availableCheckpoints}
            extraOptions={extraStopOptions}
            error={errors.checkpointIds}
            hint="Drag the grip to reorder, or focus it and use the arrow keys. Save changes to apply."
          />
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
