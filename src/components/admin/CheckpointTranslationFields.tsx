import { Field } from "./ui";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdminTranslation } from "@/services/checkpoint-content";

interface Props {
  locale: string;
  defaultValue: AdminTranslation;
  prefix: string;
  errors?: Record<string, string>;
}

export function TranslationFields({ locale, defaultValue, prefix, errors }: Props) {
  const errorFor = (field: string) => errors?.[`${prefix}.${field}`];

  return (
    <div className="space-y-4" lang={locale}>
      <Field label="Name" htmlFor={`${prefix}.name`} error={errorFor("name")} required>
        <Input
          id={`${prefix}.name`}
          name={`${prefix}.name`}
          defaultValue={defaultValue.name}
          required
          autoComplete="off"
          aria-invalid={!!errorFor("name")}
        />
      </Field>
      <Field label="Summary" htmlFor={`${prefix}.summary`} error={errorFor("summary")} required>
        <Textarea
          id={`${prefix}.summary`}
          name={`${prefix}.summary`}
          defaultValue={defaultValue.summary}
          rows={3}
          required
          autoComplete="off"
          aria-invalid={!!errorFor("summary")}
        />
      </Field>
      <Field label="Address" htmlFor={`${prefix}.address`} error={errorFor("address")} required>
        <Input
          id={`${prefix}.address`}
          name={`${prefix}.address`}
          defaultValue={defaultValue.address}
          required
          autoComplete="off"
          aria-invalid={!!errorFor("address")}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Opening hours"
          htmlFor={`${prefix}.openingHours`}
          error={errorFor("openingHours")}
        >
          <Input
            id={`${prefix}.openingHours`}
            name={`${prefix}.openingHours`}
            defaultValue={defaultValue.openingHours || ""}
            autoComplete="off"
            aria-invalid={!!errorFor("openingHours")}
          />
        </Field>
        <Field
          label="Best time to visit"
          htmlFor={`${prefix}.bestTimeToVisit`}
          error={errorFor("bestTimeToVisit")}
        >
          <Input
            id={`${prefix}.bestTimeToVisit`}
            name={`${prefix}.bestTimeToVisit`}
            defaultValue={defaultValue.bestTimeToVisit || ""}
            autoComplete="off"
            aria-invalid={!!errorFor("bestTimeToVisit")}
          />
        </Field>
      </div>
    </div>
  );
}