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
import { InputField, TextAreaField, RadioField } from "@/components/form";
import { formatApiError, type AdminWriteResponse } from "@/lib/admin-form";
import { createPrivateTourSchema } from "@/lib/validations/admin";
import type { z } from "zod";
import StopsEditor, { type CheckpointOption } from "./StopsEditor";

type FormInput = z.input<typeof createPrivateTourSchema>;
type FormData = z.output<typeof createPrivateTourSchema>;

const PrivateTourNewForm = ({
  availableCheckpoints,
}: {
  availableCheckpoints: CheckpointOption[];
}) => {
  const router = useRouter();

  const form = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(createPrivateTourSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      status: "DRAFT",
      maxSlots: 10,
      vi: { name: "", tagline: "", description: "", coverImageUrl: "" },
      en: { name: "", tagline: "", description: "", coverImageUrl: "" },
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

  const stopIds = watch("checkpointIds") ?? [];

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const res = await fetch("/api/admin/private-tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json: AdminWriteResponse & {
        tour?: { id: string; code: string };
      } = await res.json();

      if (json.ok && json.tour) {
        toast.success(`Private tour created — code ${json.tour.code}`);
        router.push(`/admin/private-tours/${json.tour.id}`);
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
      <BackLink href="/admin/private-tours">Back to private tours</BackLink>
      <PageHeader title="New private tour" />
      <RequiredNote />

      <FormProvider {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-6"
        >
          <Panel title="Customer">
            <div className="space-y-4">
              <InputField
                name="customerName"
                label="Customer name"
                hint="For your own reference only."
                placeholder="Nguyễn Văn A"
                serverError={errors.customerName?.message}
              />
              <InputField
                name="customerPhone"
                label="Customer phone"
                required
                type="tel"
                hint="The visitor must enter this number (spacing is forgiven) — it is the second half of the code."
                placeholder="0912 345 678"
                serverError={errors.customerPhone?.message}
              />
              <InputField
                name="maxSlots"
                label="Visitor slots"
                type="number"
                hint="How many devices may unlock this tour. Defaults to 10."
                serverError={errors.maxSlots?.message}
              />
            </div>
          </Panel>

          <Panel title="Schedule">
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                name="startsAt"
                label="Starts at"
                type="datetime-local"
                serverError={errors.startsAt?.message}
              />
              <InputField
                name="expiresAt"
                label="Expires at"
                type="datetime-local"
                hint="Leave blank for a tour that never expires."
                serverError={errors.expiresAt?.message}
              />
            </div>
          </Panel>

          <Panel title="Status">
            <RadioField
              name="status"
              label="Status"
              hint="Only an Active tour can be unlocked by a customer."
              options={[
                { value: "DRAFT", label: "Draft" },
                { value: "ACTIVE", label: "Active" },
                { value: "REVOKED", label: "Revoked" },
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

          {/* Drag rows into the visit order; the row order is the saved order. */}
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
              onClick={() => router.push("/admin/private-tours")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create private tour"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};

export default PrivateTourNewForm;
