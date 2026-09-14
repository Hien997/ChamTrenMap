import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TTranslation } from "./CheckpointFormTypes";

interface Props {
  locale: string;
  defaultValue: TTranslation;
  prefix: string;
}

export function TranslationFields({ locale, defaultValue, prefix }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">
        {locale === "vi" ? "Tiếng Việt (vi)" : "English (en)"}
      </h3>
      <div className="space-y-1">
        <Label>Name</Label>
        <Input name={`${prefix}.name`} defaultValue={defaultValue.name} required />
      </div>
      <div className="space-y-1">
        <Label>Summary</Label>
        <Textarea name={`${prefix}.summary`} defaultValue={defaultValue.summary} required />
      </div>
      <div className="space-y-1">
        <Label>Address</Label>
        <Input name={`${prefix}.address`} defaultValue={defaultValue.address} required />
      </div>
      <div className="space-y-1">
        <Label>Opening Hours</Label>
        <Input name={`${prefix}.openingHours`} defaultValue={defaultValue.openingHours || ""} />
      </div>
      <div className="space-y-1">
        <Label>Best Time to Visit</Label>
        <Input name={`${prefix}.bestTimeToVisit`} defaultValue={defaultValue.bestTimeToVisit || ""} />
      </div>
    </div>
  );
}