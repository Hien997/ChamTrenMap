import { InputField, SelectField } from "@/components/form";

/**
 * Location/visit/pricing inputs. Values (strings) live in the page's RHF
 * store via `defaultValues` — this component renders labels + inputs only
 * (grill Q4).
 */
export function CheckpointFields() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <InputField
          name="latitude"
          label="Latitude"
          required
          type="number"
          inputProps={{ step: "0.000001" }}
        />
        <InputField
          name="longitude"
          label="Longitude"
          required
          type="number"
          inputProps={{ step: "0.000001" }}
        />
        <InputField
          name="radiusMeters"
          label="Check-in radius (m)"
          required
          type="number"
          hint="How close visitors must get to check in."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <InputField
          name="estimatedVisitMinutes"
          label="Visit length (min)"
          required
          type="number"
        />
        <InputField
          name="sortOrderHint"
          label="Sort order"
          required
          type="number"
        />
        <InputField
          name="priceVnd"
          label="Price (VND)"
          type="number"
          hint="Leave empty for free."
        />
      </div>

      <div className="max-w-48">
        <SelectField
          name="priceKind"
          label="Price kind"
          options={[
            { value: "TICKET", label: "Ticket" },
            { value: "FOOD", label: "Food" },
          ]}
        />
      </div>
    </div>
  );
}
