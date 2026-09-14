"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranslationFields } from "./CheckpointTranslationFields";
import { CheckpointFields } from "./CheckpointFields";
import { GuideSectionEditor } from "./GuideSectionEditor";
import type { TCheckpoint, TGuide } from "./CheckpointFormTypes";

export default function CheckpointEditForm({ checkpoint }: { checkpoint: TCheckpoint }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const vi = checkpoint.vi || { name: "", summary: "", address: "", openingHours: null, bestTimeToVisit: null };
  const en = checkpoint.en || { name: "", summary: "", address: "", openingHours: null, bestTimeToVisit: null };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    setError(null);
    const formData = new FormData(e.currentTarget);

    const guideKeys = ["introduction", "history", "culture", "interesting_facts", "travel_tips"];
    const guides: TGuide[] = [];
    for (const gk of guideKeys) {
      for (const locale of ["vi", "en"] as const) {
        const existing = checkpoint.guides.find((g) => g.sectionKey === gk && g.locale === locale);
        const title = (formData.get(`guide.${gk}.${locale}.title`) as string) ?? "";
        const content = (formData.get(`guide.${gk}.${locale}.content`) as string) ?? "";
        // Skip entirely-empty sections (title AND content blank) so the API
        // doesn't try to create empty guide rows.
        if (!title.trim() && !content.trim()) continue;
        guides.push({
          id: existing?.id,
          sectionKey: gk,
          locale,
          title,
          content,
          contentType: (formData.get(`guide.${gk}.${locale}.contentType`) as "TEXT" | "HTML") || "TEXT",
          sortOrder: parseInt(formData.get(`guide.${gk}.${locale}.sortOrder`) as string) || 0,
        });
      }
    }

    const payload = {
      id: checkpoint.id,
      slug: checkpoint.slug,
      latitude: parseFloat(formData.get("latitude") as string),
      longitude: parseFloat(formData.get("longitude") as string),
      radiusMeters: parseInt(formData.get("radiusMeters") as string),
      estimatedVisitMinutes: parseInt(formData.get("estimatedVisitMinutes") as string),
      sortOrderHint: parseInt(formData.get("sortOrderHint") as string),
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
      guides,
    };

    startTransition(async () => {
      const res = await fetch(`/api/admin/checkpoints/${checkpoint.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) router.push("/admin/checkpoints");
      else setError(json.error || "Save failed");
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-6 md:grid-cols-2">
        <TranslationFields locale="en" defaultValue={en} prefix="en" />
        <TranslationFields locale="vi" defaultValue={vi} prefix="vi" />
      </div>
      <CheckpointFields checkpoint={checkpoint} />
      <Tabs defaultValue="vi">
        <TabsList>
          <TabsTrigger value="vi">Guide Sections (vi)</TabsTrigger>
          <TabsTrigger value="en">Guide Sections (en)</TabsTrigger>
        </TabsList>
        <TabsContent value="vi">
          <GuideSectionEditor locale="vi" existingGuides={checkpoint.guides} />
        </TabsContent>
        <TabsContent value="en">
          <GuideSectionEditor locale="en" existingGuides={checkpoint.guides} />
        </TabsContent>
      </Tabs>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/checkpoints")} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}