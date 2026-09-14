const ALLOWED_TAGS = new Set([
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
]);

const ALLOWED_ATTRS = new Set(["href", "src", "alt", "title"]);

/**
 * Sanitize HTML content from admin input.
 * Strips script/style tags, event handlers, and javascript: URLs.
 * Only allows a safe subset of HTML tags and attributes.
 */
export function sanitizeHtml(raw: string): string {
  let cleaned = raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  cleaned = cleaned.replace(/\son\w+="[^"]*"/gi, "");
  cleaned = cleaned.replace(/href\s*=\s*"javascript:[^"]*"/gi, "");

  cleaned = cleaned.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
    return ALLOWED_TAGS.has(tag.toLowerCase()) ? match : "";
  });

  cleaned = cleaned.replace(
    /<([a-z][a-z0-9]*)\s+([^>]*)>/gi,
    (match, tag, attrs) => {
      if (!ALLOWED_TAGS.has(tag.toLowerCase())) return match;
      const safeAttrs = attrs
        .split(/\s+/)
        .filter((attr: string) => {
          const name = attr.split("=")[0].toLowerCase();
          return ALLOWED_ATTRS.has(name);
        })
        .join(" ");
      return safeAttrs ? `<${tag} ${safeAttrs}>` : `<${tag}>`;
    },
  );

  return cleaned;
}
