"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranslationFields } from "./CheckpointTranslationFields";
import { CheckpointFields } from "./CheckpointFields";
import { GuideSection } from "./GuideSection";
import { BackLink, PageHeader, Panel } from "./ui";
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

    const guides: TGuide[] = [];
    for (const locale of ["vi", "en"] as const) {
      const existing = checkpoint.guides.find((g) => g.locale === locale);
      const content = ((formData.get(`guide.${locale}.content`) as string) ?? "").trim();
      // Skip empty locales so the API doesn't try to create empty guide rows.
      if (!content) continue;
      guides.push({
        id: existing?.id,
        locale,
        content,
        contentType: "HTML",
      });
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
    <div>
      <BackLink href="/admin/checkpoints">Back to checkpoints</BackLink>
      <PageHeader
        title={vi.name || checkpoint.slug}
        sub={`/${checkpoint.slug}`}
      />

      <form onSubmit={onSubmit} className="space-y-6">
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Tiếng Việt (vi)">
            <TranslationFields locale="vi" defaultValue={vi} prefix="vi" />
          </Panel>
          <Panel title="English (en)">
            <TranslationFields locale="en" defaultValue={en} prefix="en" />
          </Panel>
        </div>

        <Panel title="Location & visit">
          <CheckpointFields checkpoint={checkpoint} />
        </Panel>

        <Panel title="Guide content">
          {/* keepMounted on both panels: the hidden locale's fields must stay in
              the DOM so they still appear in FormData. Without it the inactive
              locale submitted no guide fields at all, and because the PATCH
              route replaces every guide row (deleteMany + createMany) that
              silently wiped the other locale's guides on each save. */}
          <Tabs defaultValue="vi">
            <TabsList>
              <TabsTrigger value="vi">Tiếng Việt</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>
            <TabsContent value="vi" keepMounted className="mt-4">
              <GuideSection locale="vi" guides={checkpoint.guides} />
            </TabsContent>
            <TabsContent value="en" keepMounted className="mt-4">
              <GuideSection locale="en" guides={checkpoint.guides} />
            </TabsContent>
          </Tabs>
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
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}