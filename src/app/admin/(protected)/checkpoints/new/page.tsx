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
import { Button } from "@/components/ui/button";
import {
  BackLink,
  PageHeader,
  Panel,
  RequiredNote,
} from "@/components/admin/ui";
import { TranslationFields } from "@/components/admin/CheckpointTranslationFields";
import { CheckpointFields } from "@/components/admin/CheckpointFields";
import { GuideContentPanel } from "@/components/admin/GuideContentPanel";
import { InputField } from "@/components/form";
import { formatApiError, type AdminWriteResponse } from "@/lib/admin-form";
import {
  CREATE_DEFAULT_VALUES,
  createCheckpointFormSchema,
  isCheckpointFormPath,
  type CheckpointCreateFormValues,
} from "@/lib/checkpoint-form";
import type { CreateCheckpointPayload } from "@/services/checkpoint-content";

/** What the form registers: everything is a string until the resolver parses. */
type FormInput = CheckpointCreateFormValues;
/** What the resolver hands `onSubmit`: the validated API payload. */
type FormOutput = CreateCheckpointPayload;

export default function AdminCheckpointNewPage() {
  const router = useRouter();

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createCheckpointFormSchema),
    defaultValues: CREATE_DEFAULT_VALUES,
    mode: "onChange",
  });
  const {
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = form;

  const onSubmit: SubmitHandler<FormOutput> = async (data) => {
    try {
      const res = await fetch("/api/admin/checkpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json: AdminWriteResponse = await res.json();

      if (json.ok) {
        toast.success("Checkpoint created successfully!");
        router.push(`/admin/checkpoints/${data.slug}`);
      } else {
        toast.error(formatApiError(json.error, json.details));
        if (json.details) {
          for (const detail of json.details) {
            // Paths without a registered input (guides.*, general) have no
            // inline slot — the toast above is their only surface (grill Q5).
            if (isCheckpointFormPath(detail.path)) {
              setError(detail.path as FieldPath<FormInput>, {
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
      <PageHeader title="New checkpoint" />
      <RequiredNote />

      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          <Panel title="URL slug">
            <InputField
              name="slug"
              label="Slug"
              required
              hint="Shown in the public URL, e.g. chua-phu-dung."
              placeholder="chua-phu-dung"
              serverError={errors.slug?.message}
            />
          </Panel>

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
              {isSubmitting ? "Creating…" : "Create checkpoint"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
