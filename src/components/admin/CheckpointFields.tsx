import { Field } from "./ui";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminCheckpoint } from "@/services/checkpoint-content";

interface Props {
  checkpoint?: Partial<AdminCheckpoint>;
  errors?: Record<string, string>;
}

export function CheckpointFields({ checkpoint, errors }: Props) {
  const errorFor = (field: string) => errors?.[field];
  const c = {
    latitude: checkpoint?.latitude ?? 10.3864,
    longitude: checkpoint?.longitude ?? 104.4516,
    radiusMeters: checkpoint?.radiusMeters ?? 100,
    estimatedVisitMinutes: checkpoint?.estimatedVisitMinutes ?? 30,
    sortOrderHint: checkpoint?.sortOrderHint ?? 0,
    priceVnd: checkpoint?.priceVnd ?? null,
    priceKind: checkpoint?.priceKind ?? ("TICKET" as const),
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Latitude" htmlFor="latitude" error={errorFor("latitude")} required>
          <Input
            id="latitude"
            name="latitude"
            type="number"
            step="0.000001"
            defaultValue={c.latitude}
            required
            autoComplete="off"
            aria-invalid={!!errorFor("latitude")}
          />
        </Field>
        <Field label="Longitude" htmlFor="longitude" error={errorFor("longitude")} required>
          <Input
            id="longitude"
            name="longitude"
            type="number"
            step="0.000001"
            defaultValue={c.longitude}
            required
            autoComplete="off"
            aria-invalid={!!errorFor("longitude")}
          />
        </Field>
        <Field
          label="Check-in radius (m)"
          htmlFor="radiusMeters"
          required
          hint="How close visitors must get to check in."
          error={errorFor("radiusMeters")}
        >
          <Input
            id="radiusMeters"
            name="radiusMeters"
            type="number"
            defaultValue={c.radiusMeters}
            required
            aria-describedby="radiusMeters-hint"
            autoComplete="off"
            aria-invalid={!!errorFor("radiusMeters")}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Visit length (min)"
          htmlFor="estimatedVisitMinutes"
          required
          error={errorFor("estimatedVisitMinutes")}
        >
          <Input
            id="estimatedVisitMinutes"
            name="estimatedVisitMinutes"
            type="number"
            defaultValue={c.estimatedVisitMinutes}
            required
            autoComplete="off"
            aria-invalid={!!errorFor("estimatedVisitMinutes")}
          />
        </Field>
        <Field label="Sort order" htmlFor="sortOrderHint" error={errorFor("sortOrderHint")} required>
          <Input
            id="sortOrderHint"
            name="sortOrderHint"
            type="number"
            defaultValue={c.sortOrderHint}
            required
            autoComplete="off"
            aria-invalid={!!errorFor("sortOrderHint")}
          />
        </Field>
        <Field
          label="Price (VND)"
          htmlFor="priceVnd"
          hint="Leave empty for free."
          error={errorFor("priceVnd")}
        >
          <Input
            id="priceVnd"
            name="priceVnd"
            type="number"
            defaultValue={c.priceVnd ?? ""}
            aria-describedby="priceVnd-hint"
            autoComplete="off"
            aria-invalid={!!errorFor("priceVnd")}
          />
        </Field>
      </div>

      <div className="max-w-48">
        <Field label="Price kind" htmlFor="priceKind" error={errorFor("priceKind")}>
          <Select name="priceKind" defaultValue={c.priceKind}>
            <SelectTrigger id="priceKind" aria-invalid={!!errorFor("priceKind")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TICKET">Ticket</SelectItem>
              <SelectItem value="FOOD">Food</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
}
