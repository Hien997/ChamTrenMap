import sanitizeHtmlLib from "sanitize-html";

/**
 * The single stored-XSS defense (S2): guide HTML is the only content rendered
 * through `dangerouslySetInnerHTML`, and it passes through this seam on write
 * (`checkpoint-content.server`) and again on read (`GuideContent`).
 *
 * The original regex implementation had grammar bypasses — `/`-separated tags
 * (`<img/src=x onerror=…>`), single-quoted `javascript:` URLs, and unterminated
 * tags — so the body is delegated to `sanitize-html`, a maintained allowlist
 * parser. The public interface stays `sanitizeHtml(raw): string`.
 */

// Editorial set for guide articles — deliberately no layout/scripting tags.
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "a",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "img",
  "blockquote",
];

export function sanitizeHtml(raw: string): string {
  return sanitizeHtmlLib(raw, {
    allowedTags: ALLOWED_TAGS,
    // Same attribute allowlist as before, applied to every allowed tag.
    allowedAttributes: { "*": ["href", "src", "alt", "title"] },
    // Scheme allowlist kills `javascript:`/`data:` URLs regardless of quoting.
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    // `<script>`/`<style>` bodies must vanish with the tag, not become text.
    nonTextTags: ["script", "style", "textarea", "option"],
    // Disallowed wrappers (e.g. `<div>`) are dropped but keep their content.
    disallowedTagsMode: "discard",
  });
}
