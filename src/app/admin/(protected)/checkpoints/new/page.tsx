"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackLink, Field, PageHeader, Panel } from "@/components/admin/ui";
import { TranslationFields } from "@/components/admin/CheckpointTranslationFields";
import { CheckpointFields } from "@/components/admin/CheckpointFields";

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
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    setError(null);
    const formData = new FormData(e.currentTarget);

    const payload = {
      slug: formData.get("slug") as string,
      latitude: parseFloat(formData.get("latitude") as string),
      longitude: parseFloat(formData.get("longitude") as string),
      radiusMeters: parseInt(formData.get("radiusMeters") as string) || 100,
      estimatedVisitMinutes: parseInt(formData.get("estimatedVisitMinutes") as string) || 30,
      sortOrderHint: parseInt(formData.get("sortOrderHint") as string) || 0,
      priceVnd: formData.get("priceVnd") ? parseFloat(formData.get("priceVnd") as string) : null,
      priceKind: formData.get("priceKind") as "TICKET" | "FOOD",
      vi: {
        name: formData.get("vi.name") as string,
        summary: formData.get("vi.summary") as string,
        address: formData.get("vi.address") as string,
        openingHours: formData.get("vi.openingHours") || null,
        bestTimeToVisit: formData.get("vi.bestTimeToVisit") || null,
      },
      en: {
        name: formData.get("en.name") as string,
        summary: formData.get("en.summary") as string,
        address: formData.get("en.address") as string,
        openingHours: formData.get("en.openingHours") || null,
        bestTimeToVisit: formData.get("en.bestTimeToVisit") || null,
      },
      guides: [],
    };

    startTransition(async () => {
      const res = await fetch("/api/admin/checkpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) router.push(`/admin/checkpoints/${payload.slug}`);
      else setError(json.error || "Create failed");
    });
  };

  return (
    <div>
      <BackLink href="/admin/checkpoints">Back to checkpoints</BackLink>
      <PageHeader title="New checkpoint" />

      {error && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <Panel title="URL slug">
          <Field
            label="Slug"
            htmlFor="slug"
            hint="Shown in the public URL, e.g. chua-phu-dung."
          >
            <Input
              id="slug"
              name="slug"
              placeholder="chua-phu-dung"
              required
              autoComplete="off"
            />
          </Field>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Tiếng Việt (vi)">
            <TranslationFields locale="vi" defaultValue={emptyTranslation} prefix="vi" />
          </Panel>
          <Panel title="English (en)">
            <TranslationFields locale="en" defaultValue={emptyTranslation} prefix="en" />
          </Panel>
        </div>

        <Panel title="Location & visit">
          <CheckpointFields />
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