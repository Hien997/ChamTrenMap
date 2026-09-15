import { sanitizeHtml } from "@/lib/sanitize";

/** Single guide-content renderer: sanitized HTML, shared by public page + admin preview. */
export function GuideContentRenderer({ content }: { content: string }) {
  if (!content.trim()) return null;
  return (
    <div
      className="flex flex-col gap-3 leading-relaxed text-foreground/90 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:text-lg [&_h3]:font-medium [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) ?? "" }}
    />
  );
}
