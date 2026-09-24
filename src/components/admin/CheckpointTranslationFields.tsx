import { InputField, TextAreaField } from "@/components/form";

/**
 * Name/summary/address + meta for one locale. Each field registers itself
 * through the page's `FormProvider`, so the only input here is the locale —
 * no defaultValue, no flat error map (grill Q4).
 */
export function TranslationFields({ locale }: { locale: "vi" | "en" }) {
  return (
    <div className="space-y-4" lang={locale}>
      <InputField name={`${locale}.name`} label="Name" required />
      <TextAreaField
        name={`${locale}.summary`}
        label="Summary"
        required
        rows={3}
      />
      <InputField name={`${locale}.address`} label="Address" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField name={`${locale}.openingHours`} label="Opening hours" />
        <InputField
          name={`${locale}.bestTimeToVisit`}
          label="Best time to visit"
        />
      </div>
    </div>
  );
}