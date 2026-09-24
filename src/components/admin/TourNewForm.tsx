"use client";

import { useRouter } from "next/navigation";
import { FormProvider, useForm, type FieldPath, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  BackLink,
  PageHeader,
  Panel,
  RequiredNote,
} from "@/components/admin/ui";
import { InputField, TextAreaField, RadioField } from "@/components/form";
import { formatApiError, type AdminWriteResponse } from "@/lib/admin-form";
import { createTourSchema } from "@/lib/validations/admin";
import type { z } from "zod";
import StopsEditor, { type CheckpointOption } from "./StopsEditor";

/** Input shape accepted by the form (status optional thanks to `.default()`). */
type FormInput = z.input<typeof createTourSchema>;
/** Output shape produced by the resolver after Zod parses/defaults. */
type FormData = z.output<typeof createTourSchema>;

export default function TourNewForm({
  availableCheckpoints,
}: {
  availableCheckpoints: CheckpointOption[];
}) {
  const router = useRouter();

  const form = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(createTourSchema),
    defaultValues: {
      slug: "",
      status: "DRAFT",
      vi: {
        name: "",
        tagline: "",
        description: "",
        coverImageUrl: "",
      },
      en: {
        name: "",
        tagline: "",
        description: "",
        coverImageUrl: "",
      },
      checkpointIds: [],
    },
    mode: "onChange",
  });
  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
    setError,
  } = form;

  // Stops are a registered field: the resolver validates them (dup/cap) and
  // the API's `checkpointIds` error details land on this path via setError.
  const stopIds = watch("checkpointIds") ?? [];

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const res = await fetch("/api/admin/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json: AdminWriteResponse = await res.json();

      if (json.ok) {
        toast.success("Tour created successfully!");
        router.push(`/admin/tours/${data.slug}`);
      } else {
        toast.error(formatApiError(json.error, json.details));
        if (json.details) {
          for (const detail of json.details) {
            setError(detail.path as FieldPath<FormInput>, {
              message: detail.message,
            });
          }
        }
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <div>
      <BackLink href="/admin/tours">Back to tours</BackLink>
      <PageHeader title="New tour" />
      <RequiredNote />

      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <Panel title="URL slug">
          <InputField
            name="slug"
            label="Slug"
            required
            hint="Shown in the public URL, e.g. ha-tien-discovery."
            placeholder="ha-tien-discovery"
            serverError={errors.slug?.message}
          />

          <RadioField
            name="status"
            label="Status"
            required
            hint="Draft hides the tour from public view."
            options={[
              { value: "DRAFT", label: "Draft" },
              { value: "PUBLISHED", label: "Published" },
            ]}
            serverError={errors.status?.message}
          />
        </Panel>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Tiếng Việt (vi)">
            <div className="space-y-4">
              <InputField
                name="vi.name"
                label="Name"
                required
                placeholder="Tên tour"
                serverError={errors.vi?.name?.message}
              />
              <InputField
                name="vi.tagline"
                label="Tagline"
                serverError={errors.vi?.tagline?.message}
              />
              <TextAreaField
                name="vi.description"
                label="Description"
                required
                rows={3}
                serverError={errors.vi?.description?.message}
              />
              <InputField
                name="vi.coverImageUrl"
                label="Cover image URL"
                type="url"
                placeholder="https://…"
                serverError={errors.vi?.coverImageUrl?.message}
              />
            </div>
          </Panel>

          <Panel title="English (en)">
            <div className="space-y-4">
              <InputField
                name="en.name"
                label="Name"
                required
                placeholder="Tour name"
                serverError={errors.en?.name?.message}
              />
              <InputField
                name="en.tagline"
                label="Tagline"
                serverError={errors.en?.tagline?.message}
              />
              <TextAreaField
                name="en.description"
                label="Description"
                required
                rows={3}
                serverError={errors.en?.description?.message}
              />
              <InputField
                name="en.coverImageUrl"
                label="Cover image URL"
                type="url"
                placeholder="https://…"
                serverError={errors.en?.coverImageUrl?.message}
              />
            </div>
          </Panel>
        </div>

        <Panel title={`Stops on this tour (${stopIds.length})`}>
          <StopsEditor
            value={stopIds}
            onChange={(ids) =>
              setValue("checkpointIds", ids, { shouldValidate: true })
            }
            availableCheckpoints={availableCheckpoints}
            error={errors.checkpointIds?.message}
          />
        </Panel>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/tours")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create tour"}
          </Button>
        </div>
        </form>
      </FormProvider>
    </div>
  );
}