import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "@/lib/sanitize";

describe("sanitizeHtml", () => {
  it("strips script tags", () => {
    expect(sanitizeHtml("<script>alert(1)</script>Hello")).not.toContain(
      "<script>",
    );
  });

  it("strips event handlers", () => {
    expect(sanitizeHtml('<img src=x onerror="alert(1)">')).not.toContain(
      "onerror",
    );
  });

  it("strips javascript: URLs", () => {
    expect(
      sanitizeHtml('<a href="javascript:alert(1)">click</a>'),
    ).not.toContain("javascript:");
  });

  it("allows safe tags", () => {
    const input = "<p>Hello <strong>world</strong></p>";
    expect(sanitizeHtml(input)).toContain("<p>");
    expect(sanitizeHtml(input)).toContain("<strong>");
  });

  it("allows safe attributes", () => {
    const input = '<a href="https://example.com" title="Link">text</a>';
    expect(sanitizeHtml(input)).toContain('href="https://example.com"');
  });

  it("strips style tags", () => {
    expect(sanitizeHtml("<style>body{color:red}</style>Hello")).not.toContain(
      "<style>",
    );
  });

  it("strips disallowed tags but keeps content", () => {
    expect(sanitizeHtml("<div>Hello</div>")).toContain("Hello");
    expect(sanitizeHtml("<div>Hello</div>")).not.toContain("<div>");
  });

  // S2 PoC corpus — the three grammar bypasses that defeated the old
  // regex implementation (see docs/security-review.md).
  it("strips unquoted event handlers in '/'-separated tags", () => {
    expect(sanitizeHtml("<img/src=x onerror=alert(1)>")).not.toContain(
      "onerror",
    );
  });

  it("strips single-quoted javascript: URLs", () => {
    expect(
      sanitizeHtml("<a href='javascript:alert(1)'>click</a>"),
    ).not.toContain("javascript:");
  });

  it("strips handlers on unterminated tags", () => {
    expect(sanitizeHtml("<img src=x onerror=alert(1)")).not.toContain(
      "onerror",
    );
  });
});
