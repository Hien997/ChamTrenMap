import { describe, expect, it } from "vitest";

import type { FieldValues, UseFormReturn } from "react-hook-form";

import { peekErrors } from "@/components/form/utils";

function fakeForm(errors: unknown): UseFormReturn<FieldValues> {
  return { formState: { errors } } as unknown as UseFormReturn<FieldValues>;
}

describe("peekErrors", () => {
  it("returns the message for a top-level field", () => {
    const form = fakeForm({ slug: { message: "Slug is required" } });
    expect(peekErrors(form, "slug")).toBe("Slug is required");
  });

  it("resolves nested paths like vi.name", () => {
    const form = fakeForm({
      vi: { name: { message: "Ten tour la bat buoc" } },
    });
    expect(peekErrors(form, "vi.name")).toBe("Ten tour la bat buoc");
  });

  it("resolves the nested cover image path used by the tours page", () => {
    const form = fakeForm({
      vi: { coverImageUrl: { message: "Not a valid URL" } },
    });
    expect(peekErrors(form, "vi.coverImageUrl")).toBe("Not a valid URL");
  });

  it("resolves numeric segments for array fields", () => {
    const form = fakeForm({
      options: [{ label: { message: "First option is invalid" } }],
    });
    expect(peekErrors(form, "options.0.label")).toBe("First option is invalid");
  });

  it("returns undefined when the field has no error", () => {
    const form = fakeForm({ slug: { message: "Slug is required" } });
    expect(peekErrors(form, "status")).toBeUndefined();
  });

  it("returns undefined when only part of the path matches", () => {
    const form = fakeForm({ vi: { name: { message: "Required" } } });
    expect(peekErrors(form, "vi.tagline")).toBeUndefined();
    expect(peekErrors(form, "en.name")).toBeUndefined();
  });

  it("returns undefined when a path segment is not an object", () => {
    const form = fakeForm({ slug: { message: "Slug is required" } });
    expect(peekErrors(form, "slug.message.nested")).toBeUndefined();
  });

  it("returns undefined when the leaf has no string message", () => {
    const form = fakeForm({ slug: {} });
    expect(peekErrors(form, "slug")).toBeUndefined();
    expect(peekErrors(form, "")).toBeUndefined();
  });
});
