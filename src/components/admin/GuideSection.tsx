import { Textarea } from "@/components/ui/textarea";
import { GuideContentRenderer } from "@/components/guide/GuideContent";
import type { TGuide } from "./CheckpointFormTypes";
import { useState } from "react";

interface Props {
  locale: "vi" | "en";
  /** All guide documents of the checkpoint; the locale's row is picked here. */
  guides: TGuide[];
}

/**
 * One guide document per locale: a single HTML `content` field.
 * Headings inside the HTML are structure, not DB fields.
 */
export function GuideSection({ locale, guides }: Props) {
  const base = `guide.${locale}`;
  const contentId = `${base}.content`;
  const existing = guides.find((g) => g.locale === locale);
  const [preview, setPreview] = useState(existing?.content ?? "");

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor={contentId} className="text-sm font-medium">
          Content ({locale})
        </label>
        <Textarea
          id={contentId}
          name={contentId}
          defaultValue={existing?.content ?? ""}
          onChange={(e) => setPreview(e.target.value)}
          rows={14}
          autoComplete="off"
          placeholder="<h2>Introduction</h2><p>...</p>"
        />
        <input type="hidden" name={`${base}.contentType`} value="HTML" />
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

