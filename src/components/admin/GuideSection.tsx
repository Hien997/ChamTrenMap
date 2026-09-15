import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GuideSectionKey, TGuide } from "./CheckpointFormTypes";

interface Props {
  locale: "vi" | "en";
  sectionKey: GuideSectionKey;
  label: string;
  existing?: TGuide;
}

/**
 * One guide section: title, body, content format and sort order.
 *
 * Deliberately dependency-free (no rich-text runtime): the previous Lexical
 * build imported `@lexical/quote`, which is not a published package —
 * `QuoteNode` lives in `@lexical/rich-text` — and pulled `@lexical/react`
 * from its bare path, which the package does not export. That failed the
 * whole production build, which is why no admin CSS was shipping at all.
 *
 * The HTML contract is unchanged: `content` + `contentType` ("TEXT" |
 * "HTML") are still submitted under the same field names the form reader in
 * CheckpointEditForm and the PATCH route expect, and the public page still
 * renders `HTML` via `dangerouslySetInnerHTML` and everything else as text.
 */
export function GuideSection({ locale, sectionKey, label, existing }: Props) {
  const base = `guide.${sectionKey}.${locale}`;
  const headingId = `${base}-heading`;
  const titleId = `${base}.title`;
  const contentId = `${base}.content`;
  const orderId = `${base}.sortOrder`;

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className="border-b py-6 first:pt-0 last:border-b-0 last:pb-0"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <h3 id={headingId} className="text-sm font-medium tracking-tight">
            {label}
          </h3>
          <code className="font-mono text-[0.6875rem] text-muted-foreground">
            {sectionKey}
          </code>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor={orderId}
            className="text-xs text-muted-foreground"
          >
            Order
          </label>
          <Input
            id={orderId}
            name={orderId}
            type="number"
            inputMode="numeric"
            defaultValue={existing?.sortOrder ?? 0}
            autoComplete="off"
            className="h-7 w-16 tabular-nums"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label htmlFor={titleId} className="sr-only">
            {label} title
          </label>
          <Input
            id={titleId}
            name={titleId}
            defaultValue={existing?.title ?? ""}
            placeholder="Section title"
            autoComplete="off"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={contentId} className="sr-only">
            {label} content
          </label>
          <Textarea
            id={contentId}
            name={contentId}
            defaultValue={existing?.content ?? ""}
            rows={6}
            autoComplete="off"
            placeholder="Write the guide for this section. Choose HTML below to render markup."
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Select
            name={`${base}.contentType`}
            defaultValue={existing?.contentType ?? "TEXT"}
          >
            <SelectTrigger
              size="sm"
              aria-label={`${label} content format`}
              className="w-36"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TEXT">Plain text</SelectItem>
              <SelectItem value="HTML">HTML</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            HTML renders as markup on the public page; plain text is escaped.
          </p>
        </div>
      </div>
    </div>
  );
}
