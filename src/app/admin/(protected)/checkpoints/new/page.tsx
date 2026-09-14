"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      <h1 className="mb-6 text-2xl font-bold">New Checkpoint</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-1">
          <Label>Slug</Label>
          <Input name="slug" placeholder="e.g. chua-phu-dung" required />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Latitude</Label>
            <Input name="latitude" type="number" step="0.000001" required />
          </div>
          <div className="space-y-1">
            <Label>Longitude</Label>
            <Input name="longitude" type="number" step="0.000001" required />
          </div>
          <div className="space-y-1">
            <Label>Radius (m)</Label>
            <Input name="radiusMeters" type="number" defaultValue={100} />
          </div>
          <div className="space-y-1">
            <Label>Visit (min)</Label>
            <Input name="estimatedVisitMinutes" type="number" defaultValue={30} />
          </div>
          <div className="space-y-1">
            <Label>Sort Order</Label>
            <Input name="sortOrderHint" type="number" defaultValue={0} />
          </div>
          <div className="space-y-1">
            <Label>Price</Label>
            <Input name="priceVnd" type="number" placeholder="Empty = free" />
          </div>
          <div className="space-y-1">
            <Label>Price Kind</Label>
            <Select name="priceKind" defaultValue="TICKET">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TICKET">Ticket</SelectItem>
                <SelectItem value="FOOD">Food</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-semibold">English (en)</h3>
            <div className="space-y-1"><Label>Name</Label><Input name="en.name" required /></div>
            <div className="space-y-1"><Label>Summary</Label><Textarea name="en.summary" required /></div>
            <div className="space-y-1"><Label>Address</Label><Input name="en.address" required /></div>
            <div className="space-y-1"><Label>Opening Hours</Label><Input name="en.openingHours" /></div>
            <div className="space-y-1"><Label>Best Time to Visit</Label><Input name="en.bestTimeToVisit" /></div>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold">Tiếng Việt (vi)</h3>
            <div className="space-y-1"><Label>Name</Label><Input name="vi.name" required /></div>
            <div className="space-y-1"><Label>Summary</Label><Textarea name="vi.summary" required /></div>
            <div className="space-y-1"><Label>Address</Label><Input name="vi.address" required /></div>
            <div className="space-y-1"><Label>Opening Hours</Label><Input name="vi.openingHours" /></div>
            <div className="space-y-1"><Label>Best Time to Visit</Label><Input name="vi.bestTimeToVisit" /></div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/checkpoints")} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create Checkpoint"}
          </Button>
        </div>
      </form>
    </div>
  );
}