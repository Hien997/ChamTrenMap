"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVerticalIcon } from "lucide-react";
import { useState } from "react";

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
      <h1 className="mb-6 text-2xl font-bold">Edit Tour: {tour.slug}</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-semibold">English (en)</h3>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select name="status" defaultValue={tour.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input name="en.name" defaultValue={en.name} required />
            </div>
            <div className="space-y-1">
              <Label>Tagline</Label>
              <Input name="en.tagline" defaultValue={en.tagline} required />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input name="en.description" defaultValue={en.description} required />
            </div>
            <div className="space-y-1">
              <Label>Cover Image URL</Label>
              <Input name="en.coverImageUrl" defaultValue={en.coverImageUrl || ""} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Tiếng Việt (vi)</h3>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input name="vi.name" defaultValue={vi.name} required />
            </div>
            <div className="space-y-1">
              <Label>Tagline</Label>
              <Input name="vi.tagline" defaultValue={vi.tagline} required />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input name="vi.description" defaultValue={vi.description} required />
            </div>
                        <div className="space-y-1">
              <Label>Cover Image URL</Label>
              <Input name="vi.coverImageUrl" defaultValue={vi.coverImageUrl || ""} />
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Checkpoints ({tour.checkpoints.length})</h3>
          </div>
          <div className="space-y-2">
            {tour.checkpoints.map((cp) => (
              <div
                key={cp.id}
                className="flex items-center gap-2 rounded border bg-gray-50 px-3 py-2"
              >
                <GripVerticalIcon className="h-4 w-4 cursor-move text-gray-400" />
                <span className="flex-1 text-sm">
                  {cp.order}. {cp.name}
                </span>
                <span className="text-xs text-gray-500">({cp.slug})</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Checkpoint ordering is managed on the Checkpoints page.
          </p>
        </div>

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
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}