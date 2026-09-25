"use client";

import { useRouter } from "next/navigation";
import {
  FormProvider,
  useForm,
  type FieldPath,
  type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { TranslationFields } from "./CheckpointTranslationFields";
import { CheckpointFields } from "./CheckpointFields";
import { GuideContentPanel } from "./GuideContentPanel";
import { BackLink, PageHeader, Panel, RequiredNote } from "./ui";
import {
  editDefaultValues,
  isCheckpointFormPath,
  updateCheckpointFormSchema,
  type CheckpointUpdateFormValues,
  type CheckpointUpdateSubmit,
} from "@/lib/checkpoint-form";
import type { AdminCheckpoint } from "@/services/checkpoint-content";
import { formatApiError, type AdminWriteResponse } from "@/lib/admin-form";
import { Button } from "@/components/ui/button";

export default function CheckpointEditForm({
  checkpoint,
}: {
  checkpoint: AdminCheckpoint;
}) {
  const router = useRouter();

  const form = useForm<
    CheckpointUpdateFormValues,
    unknown,
    CheckpointUpdateSubmit
  >({
    resolver: zodResolver(updateCheckpointFormSchema(checkpoint)),
    defaultValues: editDefaultValues(checkpoint),
    mode: "onChange",
  });
  const {
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = form;

  const onSubmit: SubmitHandler<CheckpointUpdateSubmit> = async (data) => {
    try {
      const res = await fetch(`/api/admin/checkpoints/${checkpoint.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json: AdminWriteResponse = await res.json();
      if (json.ok) {
        toast.success("Checkpoint saved successfully!");
        router.push("/admin/checkpoints");
      } else {
        toast.error(formatApiError(json.error, json.details));
        if (json.details) {
          for (const detail of json.details) {
            // Only roots with a registered input get an inline error; the
            // toast covers everything else (grill Q5).
            if (isCheckpointFormPath(detail.path)) {
              setError(detail.path as FieldPath<CheckpointUpdateFormValues>, {
                message: detail.message,
              });
            }
          }
        }
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <div>
      <BackLink href="/admin/checkpoints">Back to checkpoints</BackLink>
      <PageHeader
        title={checkpoint.vi?.name || checkpoint.slug}
        sub={`/${checkpoint.slug}`}
      />
      <RequiredNote />

      <FormProvider {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-6"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Tiếng Việt (vi)">
              <TranslationFields locale="vi" />
            </Panel>
            <Panel title="English (en)">
              <TranslationFields locale="en" />
            </Panel>
          </div>

          <Panel title="Location & visit">
            <CheckpointFields />
          </Panel>

          <GuideContentPanel />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/checkpoints")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
