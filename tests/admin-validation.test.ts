import { describe, expect, it } from "vitest";

import { formatApiError, toFieldErrors } from "@/lib/admin-form";
import { createTourSchema, loginSchema, updateTourSchema } from "@/lib/validations/admin";

const VALID_CREATE = {
  slug: "ha-tien-discovery",
  status: "DRAFT" as const,
  vi: {
    name: "Hà Tiên",
    tagline: "Khám phá",
    description: "Mô tả",
    coverImageUrl: "",
  },
  en: {
    name: "Ha Tien",
    tagline: "Discover",
    description: "Description",
    coverImageUrl: "https://example.com/cover.jpg",
  },
};

describe("createTourSchema", () => {
  it("accepts a full payload and an empty cover image URL", () => {
    const result = createTourSchema.safeParse(VALID_CREATE);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("DRAFT");
  });

  it("defaults a missing status to DRAFT rather than failing the enum", () => {
    const result = createTourSchema.safeParse({
      slug: VALID_CREATE.slug,
      vi: VALID_CREATE.vi,
      en: VALID_CREATE.en,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("DRAFT");
  });

  it("names each missing field instead of a generic 'Invalid input'", () => {
    const result = createTourSchema.safeParse({
      ...VALID_CREATE,
      slug: "",
      vi: { ...VALID_CREATE.vi, name: "", tagline: "" },
    });
    expect(result.success).toBe(false);
    if (result.success) return;

    const messages = Object.fromEntries(
      result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
    );
    expect(messages.slug).toBe("Slug is required.");
    expect(messages["vi.name"]).toBe("Name is required.");
    expect(messages["vi.tagline"]).toBe("Tagline is required.");
  });

  it("rejects a cover image that is neither blank nor a URL", () => {
    const result = createTourSchema.safeParse({
      ...VALID_CREATE,
      en: { ...VALID_CREATE.en, coverImageUrl: "not-a-url" },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0].path.join(".")).toBe("en.coverImageUrl");
    expect(result.error.issues[0].message).toMatch(/full URL/);
  });
});

describe("updateTourSchema", () => {
  it("accepts an empty cover image URL so the field can be cleared", () => {
    const result = updateTourSchema.safeParse({
      id: "tour_1",
      vi: { ...VALID_CREATE.vi, coverImageUrl: "" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts a status-only patch", () => {
    expect(updateTourSchema.safeParse({ status: "PUBLISHED" }).success).toBe(true);
  });

  it("rejects an unknown status with a readable message", () => {
    const result = updateTourSchema.safeParse({ status: "ARCHIVED" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0].message).toBe("Choose a status.");
  });
});

describe("toFieldErrors", () => {
  it("maps dotted issue paths onto the matching input names", () => {
    expect(
      toFieldErrors([
        { path: "vi.name", message: "Name is required." },
        { path: "slug", message: "Slug is required." },
      ]),
    ).toEqual({
      "vi.name": "Name is required.",
      slug: "Slug is required.",
    });
  });

  it("keeps the first message per field — Zod reports every failed check", () => {
    // A blank email fails both min(1) and email(); the inline slot can only
    // show one, and "required" is the more useful of the two.
    expect(
      toFieldErrors([
        { path: "email", message: "Email is required." },
        { path: "email", message: "Enter a valid email address." },
      ]),
    ).toEqual({ email: "Email is required." });
  });

  it("falls back to 'general' when the issue carries no path", () => {
    expect(toFieldErrors([{ path: "", message: "Nope" }])).toEqual({
      general: "Nope",
    });
  });

  it("returns an empty map when the API sent no details", () => {
    expect(toFieldErrors(undefined)).toEqual({});
  });
});

describe("formatApiError", () => {
  it("joins the envelope error with every field detail", () => {
    expect(
      formatApiError("Invalid input", [
        { path: "slug", message: "Slug is required." },
        { path: "vi.name", message: "Name is required." },
      ]),
    ).toBe("Invalid input — slug: Slug is required.; vi.name: Name is required.");
  });

  it("uses only the details when the envelope carries no error", () => {
    expect(formatApiError(undefined, [{ path: "slug", message: "Taken" }])).toBe(
      "slug: Taken",
    );
  });

  it("falls back to a generic message when the envelope is empty", () => {
    expect(formatApiError(undefined, undefined)).toBe("Request failed");
    expect(formatApiError("", [])).toBe("Request failed");
  });
});

describe("updateTourSchema checkpointIds", () => {
  it("accepts an ordered list of stop ids", () => {
    const result = updateTourSchema.safeParse({
      checkpointIds: ["cp_1", "cp_2", "cp_3"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.checkpointIds).toEqual(["cp_1", "cp_2", "cp_3"]);
    }
  });

  it("accepts an empty list so the last stop can be removed", () => {
    const result = updateTourSchema.safeParse({ checkpointIds: [] });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.checkpointIds).toEqual([]);
  });

  it("rejects duplicates instead of silently collapsing them", () => {
    const result = updateTourSchema.safeParse({ checkpointIds: ["cp_1", "cp_1"] });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0].path.join(".")).toBe("checkpointIds");
    expect(result.error.issues[0].message).toBe(
      "A checkpoint can only appear once on a tour.",
    );
  });

  it("rejects more stops than the cap allows", () => {
    const tooMany = Array.from({ length: 101 }, (_, i) => `cp_${i}`);
    const result = updateTourSchema.safeParse({ checkpointIds: tooMany });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0].message).toBe(
      "A tour can have at most 100 stops.",
    );
  });

  it("stays optional so a translations-only patch still validates", () => {
    const result = updateTourSchema.safeParse({ status: "PUBLISHED" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.checkpointIds).toBeUndefined();
  });
});

describe("loginSchema", () => {
  it("accepts a filled pair", () => {
    expect(
      loginSchema.safeParse({ email: "admin@example.com", password: "secret" })
        .success,
    ).toBe(true);
  });

  it("names each missing field for inline display", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    expect(result.success).toBe(false);
    if (result.success) return;

    // Both checks fire per field; `toFieldErrors` keeps the first.
    expect(toFieldErrors(result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })))).toEqual({
      email: "Email is required.",
      password: "Password is required.",
    });
  });

  it("rejects a malformed email with a readable message", () => {
    const result = loginSchema.safeParse({ email: "nope", password: "secret" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0].message).toBe("Enter a valid email address.");
  });
});
