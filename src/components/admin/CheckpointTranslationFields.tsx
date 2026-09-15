import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TTranslation } from "./CheckpointFormTypes";
import { Field } from "./ui";

interface Props {
  locale: string;
  defaultValue: TTranslation;
  prefix: string;
}

export function TranslationFields({ locale, defaultValue, prefix }: Props) {
  return (
    <div className="space-y-4" lang={locale}>
      <Field label="Name" htmlFor={`${prefix}.name`}>
        <Input
          id={`${prefix}.name`}
          name={`${prefix}.name`}
          defaultValue={defaultValue.name}
          required
          autoComplete="off"
        />
      </Field>
      <Field label="Summary" htmlFor={`${prefix}.summary`}>
        <Textarea
          id={`${prefix}.summary`}
          name={`${prefix}.summary`}
          defaultValue={defaultValue.summary}
          rows={3}
          required
          autoComplete="off"
        />
      </Field>
      <Field label="Address" htmlFor={`${prefix}.address`}>
        <Input
          id={`${prefix}.address`}
          name={`${prefix}.address`}
          defaultValue={defaultValue.address}
          required
          autoComplete="off"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Opening hours" htmlFor={`${prefix}.openingHours`}>
          <Input
            id={`${prefix}.openingHours`}
            name={`${prefix}.openingHours`}
            defaultValue={defaultValue.openingHours || ""}
            autoComplete="off"
          />
        </Field>
        <Field label="Best time to visit" htmlFor={`${prefix}.bestTimeToVisit`}>
          <Input
            id={`${prefix}.bestTimeToVisit`}
            name={`${prefix}.bestTimeToVisit`}
            defaultValue={defaultValue.bestTimeToVisit || ""}
            autoComplete="off"
          />
        </Field>
      </div>
    </div>
  );
}