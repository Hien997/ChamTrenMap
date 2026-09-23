/**
 * Serialize a value for a `<script type="application/ld+json">` block (S4).
 *
 * `JSON.stringify` does not escape `<`, so an admin-entered field containing
 * `</script><img …>` would close the script tag early and inject markup for
 * every visitor of the page. Escaping every `<` keeps the payload valid
 * JSON — parsers decode the escaped form back to `<` — while making a
 * breakout impossible.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
