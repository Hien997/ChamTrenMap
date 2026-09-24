import { useFormContext, useWatch } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { GuideContentRenderer } from "@/components/guide/GuideContent";

interface Props {
  locale: "vi" | "en";
}

/**
 * One locale's guide editor. The textarea registers through the page's
 * FormProvider and the preview derives from the watched value, so
 * defaultValues seed both at once — no local state, and the unregistered
 * hidden contentType input is gone (the field readers always emit "HTML").
 */
export function GuideSection({ locale }: Props) {
  const { register } = useFormContext();
  const contentId = `guide.${locale}.content`;
  const preview = String(useWatch({ name: contentId }) ?? "");

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor={contentId} className="text-sm font-medium">
          Content ({locale})
        </label>
        <Textarea
          id={contentId}
          rows={14}
          placeholder="<h2>Introduction</h2><p>...</p>"
          {...register(contentId)}
        />
        <p className="text-xs text-muted-foreground">
          One HTML document. Use headings (h2/h3) to create sections freely.
        </p>
      </div>

      {preview.trim() && (
        <div className="rounded-lg border bg-card p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Preview
          </p>
          <GuideContentRenderer content={preview} />
        </div>
      )}
    </div>
  );
}
