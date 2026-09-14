"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      <h1 className="mb-6 text-2xl font-bold">New Tour</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-1">
          <Label>Slug</Label>
          <Input name="slug" placeholder="e.g. ha-tien-discovery" required />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-semibold">English (en)</h3>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input name="en.name" placeholder="Tour name (English)" required />
            </div>
            <div className="space-y-1">
              <Label>Tagline</Label>
              <Input name="en.tagline" required />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input name="en.description" required />
            </div>
            <div className="space-y-1">
              <Label>Cover Image URL</Label>
              <Input name="en.coverImageUrl" placeholder="https://..." />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Tiếng Việt (vi)</h3>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input name="vi.name" placeholder="Tên tour (Việt)" required />
            </div>
            <div className="space-y-1">
              <Label>Tagline</Label>
              <Input name="vi.tagline" required />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input name="vi.description" required />
            </div>
            <div className="space-y-1">
              <Label>Cover Image URL</Label>
              <Input name="vi.coverImageUrl" placeholder="https://..." />
            </div>
          </div>
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
            {isPending ? "Creating…" : "Create Tour"}
          </Button>
        </div>
      </form>
    </div>
  );
}