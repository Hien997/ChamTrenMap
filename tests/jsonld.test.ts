import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "@/lib/jsonld";

describe("serializeJsonLd", () => {
  it("neutralizes a </script> breakout payload from admin-entered fields", () => {
    const out = serializeJsonLd({
      name: "</script><img src=x onerror=alert(1)>",
      description: "innocent",
    });
    // No raw '<' may survive into the <script> body — that is what closes
    // the tag. ( '>' alone is harmless. )
    expect(out).not.toContain("<");
  });

  it("round-trips through JSON.parse back to the original value", () => {
    const value = { name: "</script>", nested: ["<b>", { n: 1 }] };
    expect(JSON.parse(serializeJsonLd(value))).toEqual(value);
  });

  it("replaces every '<' with the six-character \\u003c escape", () => {
    expect(serializeJsonLd({ a: "<", b: "<<" })).toBe(
      '{"a":"\\u003c","b":"\\u003c\\u003c"}',
    );
  });

  it("leaves angle-bracket-free values untouched", () => {
    expect(serializeJsonLd({ name: "Bến Ninh Kiều" })).toBe(
      '{"name":"Bến Ninh Kiều"}',
    );
  });
});
