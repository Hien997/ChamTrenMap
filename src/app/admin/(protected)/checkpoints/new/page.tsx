"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackLink, Field, PageHeader, Panel, RequiredNote } from "@/components/admin/ui";
import { TranslationFields } from "@/components/admin/CheckpointTranslationFields";
import { CheckpointFields } from "@/components/admin/CheckpointFields";
import { formatApiError, toFieldErrors, type AdminWriteResponse } from "@/lib/admin-form";
import {
  createCheckpointSchema,
  parseCheckpointCreateForm,
} from "@/services/checkpoint-content";

const emptyTranslation = {
  name: "",
  summary: "",
  address: "",
  openingHours: null,
  bestTimeToVisit: null,
};

export default function AdminCheckpointNewPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    setErrors({});
    const formData = new FormData(e.currentTarget);

    const payload = parseCheckpointCreateForm(formData);

    // Client-side validation
    const parsed = createCheckpointSchema.safeParse(payload);
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
      const res = await fetch("/api/admin/checkpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: AdminWriteResponse = await res.json();
      if (json.ok) {
        toast.success("Checkpoint created successfully!");
        router.push(`/admin/checkpoints/${payload.slug}`);
      } else {
        toast.error(formatApiError(json.error, json.details));
        setErrors(toFieldErrors(json.details));
      }
    });
  };

  return (
    <div>
      <BackLink href="/admin/checkpoints">Back to checkpoints</BackLink>
      <PageHeader title="New checkpoint" />
      <RequiredNote />

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <Panel title="URL slug">
          <Field
            label="Slug"
            htmlFor="slug"
            required
            hint="Shown in the public URL, e.g. chua-phu-dung."
            error={errors.slug}
          >
            <Input
              id="slug"
              name="slug"
              placeholder="chua-phu-dung"
              required
              autoComplete="off"
              aria-invalid={!!errors.slug}
            />
          </Field>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Tiếng Việt (vi)">
            <TranslationFields
              locale="vi"
              defaultValue={emptyTranslation}
              prefix="vi"
              errors={errors}
            />
          </Panel>
          <Panel title="English (en)">
            <TranslationFields
              locale="en"
              defaultValue={emptyTranslation}
              prefix="en"
              errors={errors}
            />
          </Panel>
        </div>

        <Panel title="Location & visit">
          <CheckpointFields errors={errors} />
        </Panel>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/checkpoints")}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create checkpoint"}
          </Button>
        </div>
      </form>
    </div>
  );
}
