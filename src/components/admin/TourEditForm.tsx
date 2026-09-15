"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVerticalIcon } from "lucide-react";
import { BackLink, Field, PageHeader, Panel, StatusChip } from "./ui";

type TCheckpointRef = {
  id: string;
  slug: string;
  name: string;
  order: number;
};

type TTour = {
  id: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  vi: { name: string; tagline: string; description: string; coverImageUrl?: string | null } | null;
  en: { name: string; tagline: string; description: string; coverImageUrl?: string | null } | null;
  checkpoints: TCheckpointRef[];
};

export default function AdminTourEditPage({ tour }: { tour: TTour }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const vi = tour.vi || { name: "", tagline: "", description: "" };
  const en = tour.en || { name: "", tagline: "", description: "" };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
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
    };

    startTransition(async () => {
      const res = await fetch(`/api/admin/tours/${tour.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.ok) {
        router.push("/admin/tours");
      } else {
        setError(json.error || "Save failed");
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

      {error && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <Panel title="Status">
          <div className="max-w-48">
            <Select name="status" defaultValue={tour.status}>
              <SelectTrigger aria-label="Publication status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Tiếng Việt (vi)">
            <div className="space-y-4">
              <Field label="Name" htmlFor="vi.name">
                <Input id="vi.name" name="vi.name" defaultValue={vi.name} required />
              </Field>
              <Field label="Tagline" htmlFor="vi.tagline">
                <Input id="vi.tagline" name="vi.tagline" defaultValue={vi.tagline} required />
              </Field>
              <Field label="Description" htmlFor="vi.description">
                <Textarea
                  id="vi.description"
                  name="vi.description"
                  defaultValue={vi.description}
                  rows={4}
                  required
                />
              </Field>
              <Field label="Cover image URL" htmlFor="vi.coverImageUrl">
                <Input
                  id="vi.coverImageUrl"
                  name="vi.coverImageUrl"
                  type="url"
                  defaultValue={vi.coverImageUrl || ""}
                  autoComplete="off"
                />
              </Field>
            </div>
          </Panel>

          <Panel title="English (en)">
            <div className="space-y-4">
              <Field label="Name" htmlFor="en.name">
                <Input id="en.name" name="en.name" defaultValue={en.name} required />
              </Field>
              <Field label="Tagline" htmlFor="en.tagline">
                <Input id="en.tagline" name="en.tagline" defaultValue={en.tagline} required />
              </Field>
              <Field label="Description" htmlFor="en.description">
                <Textarea
                  id="en.description"
                  name="en.description"
                  defaultValue={en.description}
                  rows={4}
                  required
                />
              </Field>
              <Field label="Cover image URL" htmlFor="en.coverImageUrl">
                <Input
                  id="en.coverImageUrl"
                  name="en.coverImageUrl"
                  type="url"
                  defaultValue={en.coverImageUrl || ""}
                  autoComplete="off"
                />
              </Field>
            </div>
          </Panel>
        </div>

        <Panel title={`Stops on this tour (${tour.checkpoints.length})`}>
          {tour.checkpoints.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No stops yet. Add checkpoints, then set their sort order to place
              them on this tour.
            </p>
          ) : (
            <ol className="space-y-2">
              {tour.checkpoints.map((cp) => (
                <li
                  key={cp.id}
                  className="flex items-center gap-3 rounded-md border bg-background/60 px-3 py-2"
                >
                  <GripVerticalIcon
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground/60"
                  />
                  <span className="w-5 text-sm tabular-nums text-muted-foreground">
                    {cp.order}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {cp.name}
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    /{cp.slug}
                  </span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            To change the order, edit each checkpoint&apos;s sort order.
          </p>
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