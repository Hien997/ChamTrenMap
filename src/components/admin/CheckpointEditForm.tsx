"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TranslationFields } from "./CheckpointTranslationFields";
import { CheckpointFields } from "./CheckpointFields";
import { GuideSection } from "./GuideSection";
import { BackLink, PageHeader, Panel, RequiredNote } from "./ui";
import {
  parseCheckpointUpdateForm,
  updateCheckpointSchema,
  type AdminCheckpoint,
} from "@/services/checkpoint-content";
import { formatApiError, toFieldErrors, type AdminWriteResponse } from "@/lib/admin-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export default function CheckpointEditForm({ checkpoint }: { checkpoint: AdminCheckpoint }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const vi = checkpoint.vi || { name: "", summary: "", address: "", openingHours: null, bestTimeToVisit: null };
  const en = checkpoint.en || { name: "", summary: "", address: "", openingHours: null, bestTimeToVisit: null };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    setErrors({});
    const formData = new FormData(e.currentTarget);

    const payload = {
      ...parseCheckpointUpdateForm(formData, checkpoint.guides),
      id: checkpoint.id,
      slug: checkpoint.slug,
    };

    // Client-side validation
    const parsed = updateCheckpointSchema.safeParse(payload);
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
        const res = await fetch(`/api/admin/checkpoints/${checkpoint.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json: AdminWriteResponse = await res.json();
        if (json.ok) {
          toast.success("Checkpoint saved successfully!");
          router.push("/admin/checkpoints");
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
      <BackLink href="/admin/checkpoints">Back to checkpoints</BackLink>
      <PageHeader
        title={vi.name || checkpoint.slug}
        sub={`/${checkpoint.slug}`}
      />
      <RequiredNote />

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Tiếng Việt (vi)">
            <TranslationFields
              locale="vi"
              defaultValue={vi}
              prefix="vi"
              errors={errors}
            />
          </Panel>
          <Panel title="English (en)">
            <TranslationFields
              locale="en"
              defaultValue={en}
              prefix="en"
              errors={errors}
            />
          </Panel>
        </div>

        <Panel title="Location & visit">
          <CheckpointFields checkpoint={checkpoint} errors={errors} />
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
