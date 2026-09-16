import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminCheckpoint } from "@/services/checkpoint-content";
import { Field } from "./ui";

interface Props {
  /** Partial: the "new checkpoint" page renders this with defaults only. */
  checkpoint?: Partial<AdminCheckpoint>;
}

/** Geo + visit fields shared by the edit form and the create page. */
export function CheckpointFields({ checkpoint }: Props) {
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
        <Field label="Latitude" htmlFor="latitude">
          <Input
            id="latitude"
            name="latitude"
            type="number"
            step="0.000001"
            defaultValue={c.latitude}
            required
            autoComplete="off"
          />
        </Field>
        <Field label="Longitude" htmlFor="longitude">
          <Input
            id="longitude"
            name="longitude"
            type="number"
            step="0.000001"
            defaultValue={c.longitude}
            required
            autoComplete="off"
          />
        </Field>
        <Field
          label="Check-in radius (m)"
          htmlFor="radiusMeters"
          hint="How close visitors must get to check in."
        >
          <Input
            id="radiusMeters"
            name="radiusMeters"
            type="number"
            defaultValue={c.radiusMeters}
            required
            aria-describedby="radiusMeters-hint"
            autoComplete="off"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Visit length (min)" htmlFor="estimatedVisitMinutes">
          <Input
            id="estimatedVisitMinutes"
            name="estimatedVisitMinutes"
            type="number"
            defaultValue={c.estimatedVisitMinutes}
            required
            autoComplete="off"
          />
        </Field>
        <Field label="Sort order" htmlFor="sortOrderHint">
          <Input
            id="sortOrderHint"
            name="sortOrderHint"
            type="number"
            defaultValue={c.sortOrderHint}
            required
            autoComplete="off"
          />
        </Field>
        <Field
          label="Price (VND)"
          htmlFor="priceVnd"
          hint="Leave empty for free."
        >
          <Input
            id="priceVnd"
            name="priceVnd"
            type="number"
            defaultValue={c.priceVnd ?? ""}
            aria-describedby="priceVnd-hint"
            autoComplete="off"
          />
        </Field>
      </div>

      <div className="max-w-48">
        <Field label="Price kind" htmlFor="priceKind">
          <Select name="priceKind" defaultValue={c.priceKind}>
            <SelectTrigger id="priceKind">
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