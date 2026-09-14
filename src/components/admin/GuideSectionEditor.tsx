import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GUIDE_KEYS, type TGuide } from "./CheckpointFormTypes";

interface Props {
  locale: string;
  existingGuides: TGuide[];
}

export function GuideSectionEditor({ locale, existingGuides }: Props) {
  return (
    <div className="space-y-4">
      {GUIDE_KEYS.map((gk) => {
        const existing = existingGuides.find(
          (g) => g.sectionKey === gk.key && g.locale === locale,
        );
        return (
          <div key={`${gk.key}-${locale}`} className="border p-3 rounded space-y-2">
            <h4 className="font-semibold text-sm">{gk.label}</h4>
            <Input
              name={`guide.${gk.key}.${locale}.title`}
              defaultValue={existing?.title || ""}
              placeholder="Section title"
            />
            <Textarea
              name={`guide.${gk.key}.${locale}.content`}
              defaultValue={existing?.content || ""}
              placeholder="Content (HTML allowed if contentType=HTML)"
              rows={4}
            />
            <div className="flex gap-2">
              <Select
                name={`guide.${gk.key}.${locale}.contentType`}
                defaultValue={existing?.contentType || "TEXT"}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">Plain Text</SelectItem>
                  <SelectItem value="HTML">HTML</SelectItem>
                </SelectContent>
              </Select>
              <Input
                name={`guide.${gk.key}.${locale}.sortOrder`}
                type="number"
                defaultValue={existing?.sortOrder ?? 0}
                className="w-16"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}