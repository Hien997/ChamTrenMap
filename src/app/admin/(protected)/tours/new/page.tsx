"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BackLink, Field, PageHeader, Panel } from "@/components/admin/ui";

export default function AdminTourNewPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    const payload = {
      slug: formData.get("slug") as string,
      status: formData.get("status") as "DRAFT" | "PUBLISHED",
      vi: {
        name: formData.get("vi.name") as string,
        tagline: formData.get("vi.tagline") as string,
        description: formData.get("vi.description") as string,
        coverImageUrl: (formData.get("vi.coverImageUrl") as string) || undefined,
      },
      en: {
        name: formData.get("en.name") as string,
        tagline: formData.get("en.tagline") as string,
        description: formData.get("en.description") as string,
        coverImageUrl: (formData.get("en.coverImageUrl") as string) || undefined,
      },
    };

    startTransition(async () => {
      const res = await fetch("/api/admin/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.ok) {
        router.push(`/admin/tours/${payload.slug}`);
      } else {
        setError(json.error || "Create failed");
      }
    });
  };

  return (
    <div>
      <BackLink href="/admin/tours">Back to tours</BackLink>
      <PageHeader title="New tour" />

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
            hint="Shown in the public URL, e.g. ha-tien-discovery."
          >
            <Input
              id="slug"
              name="slug"
              placeholder="ha-tien-discovery"
              required
              autoComplete="off"
            />
          </Field>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Tiếng Việt (vi)">
            <div className="space-y-4">
              <Field label="Name" htmlFor="vi.name">
                <Input id="vi.name" name="vi.name" placeholder="Tên tour" required />
              </Field>
              <Field label="Tagline" htmlFor="vi.tagline">
                <Input id="vi.tagline" name="vi.tagline" required />
              </Field>
              <Field label="Description" htmlFor="vi.description">
                <Textarea id="vi.description" name="vi.description" rows={3} required />
              </Field>
              <Field label="Cover image URL" htmlFor="vi.coverImageUrl">
                <Input
                  id="vi.coverImageUrl"
                  name="vi.coverImageUrl"
                  type="url"
                  placeholder="https://…"
                />
              </Field>
            </div>
          </Panel>

          <Panel title="English (en)">
            <div className="space-y-4">
              <Field label="Name" htmlFor="en.name">
                <Input id="en.name" name="en.name" placeholder="Tour name" required />
              </Field>
              <Field label="Tagline" htmlFor="en.tagline">
                <Input id="en.tagline" name="en.tagline" required />
              </Field>
              <Field label="Description" htmlFor="en.description">
                <Textarea id="en.description" name="en.description" rows={3} required />
              </Field>
              <Field label="Cover image URL" htmlFor="en.coverImageUrl">
                <Input
                  id="en.coverImageUrl"
                  name="en.coverImageUrl"
                  type="url"
                  placeholder="https://…"
                />
              </Field>
            </div>
          </Panel>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/tours")}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create tour"}
          </Button>
        </div>
      </form>
    </div>
  );
}