import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  adminError,
  adminOk,
  apiError,
  apiOk,
  handleApiError,
  parseAdminBody,
  parseBody,
  parseLocale,
  validationDetails,
  writeErrorResponse,
} from "@/lib/api";
import { CheckpointWriteError } from "@/services/checkpoint-content";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("public envelope (typed)", () => {
  it("apiOk wraps data under `data`", async () => {
    const res = apiOk({ n: 1 });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, data: { n: 1 } });
  });

  it("apiError uses the typed error object", async () => {
    const res = apiError("NOT_FOUND", "Gone", 404, { hint: "x" });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      ok: false,
      error: { code: "NOT_FOUND", message: "Gone", details: { hint: "x" } },
    });
  });

  it("handleApiError logs server-side and never leaks the message", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = handleApiError("ctx", new Error("db password!"));
    expect(spy).toHaveBeenCalledWith("[api] ctx:", expect.any(Error));
    const json = await res.json();
    expect(json.error.code).toBe("INTERNAL");
    expect(JSON.stringify(json)).not.toContain("db password!");
  });

  it("parseBody returns parsed data on success", () => {
    const schema = z.object({ a: z.number() });
    expect(parseBody(schema, { a: 1 })).toEqual({ ok: true, data: { a: 1 } });
  });

  it("parseBody failure yields the public 400 shape with raw issues", async () => {
    const schema = z.object({ a: z.number() });
    const parsed = parseBody(schema, { a: "x" });
    if (parsed.ok) throw new Error("expected a validation failure");
    expect(parsed.response.status).toBe(400);
    const json = await parsed.response.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("BAD_REQUEST");
    expect(json.error.details.issues).toHaveLength(1);
  });
});

describe("admin envelope (flat adapter)", () => {
  it("adminOk spreads entities at the top level", async () => {
    expect(await (await adminOk({ checkpoints: [1, 2] })).json()).toEqual({
      ok: true,
      checkpoints: [1, 2],
    });
    expect(await (await adminOk()).json()).toEqual({ ok: true });
  });

  it("adminError answers with a flat string error", async () => {
    const res = adminError("Not found", 404);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ ok: false, error: "Not found" });
  });

  it("adminError passes extra headers through `init`", async () => {
    const res = adminError("slow down", 429, {
      init: { headers: { "Retry-After": "30" } },
    });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(await res.json()).toEqual({
      ok: false,
      error: "slow down",
    });
  });

  it("adminError attaches dotted-path details for inline form errors", async () => {
    const res = adminError("Invalid input", 400, {
      details: [{ path: "vi.name", message: "Name is required." }],
    });
    expect(await res.json()).toEqual({
      ok: false,
      error: "Invalid input",
      details: [{ path: "vi.name", message: "Name is required." }],
    });
  });

  it("parseAdminBody failure yields the flat 400 shape", async () => {
    const schema = z.object({ slug: z.string().min(1) });
    const parsed = parseAdminBody(schema, { slug: "" });
    if (parsed.ok) throw new Error("expected a validation failure");
    expect(parsed.response.status).toBe(400);
    const json = await parsed.response.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe("Invalid input");
    expect(json.details).toEqual([
      { path: "slug", message: expect.any(String) },
    ]);
  });

  it("validationDetails joins nested zod paths with dots", () => {
    const schema = z.object({ vi: z.object({ name: z.string().min(1) }) });
    const result = schema.safeParse({ vi: { name: "" } });
    if (result.success) throw new Error("expected a validation failure");
    expect(validationDetails(result.error)).toEqual([
      { path: "vi.name", message: expect.any(String) },
    ]);
  });
});

describe("writeErrorResponse", () => {
  it("maps CheckpointWriteError onto the admin envelope with its status", async () => {
    const res = writeErrorResponse(
      new CheckpointWriteError("conflict", "Slug exists"),
    );
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ ok: false, error: "Slug exists" });

    const missing = writeErrorResponse(
      new CheckpointWriteError("not-found", "Not found"),
    );
    expect(missing.status).toBe(404);
  });

  it("logs unknown errors and answers with a generic JSON 500", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = writeErrorResponse(new Error("db password!"));
    expect(spy).toHaveBeenCalledWith(
      "[api] admin write:",
      expect.any(Error),
    );
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      ok: false,
      error: "Internal server error",
    });
  });
});

describe("parseLocale", () => {
  it("reads ?locale=en", () => {
    expect(parseLocale(new URLSearchParams("locale=en"))).toBe("en");
  });

  it("defaults to vi when the parameter is absent", () => {
    expect(parseLocale(new URLSearchParams())).toBe("vi");
  });

  it("rejects unknown locales", () => {
    expect(() => parseLocale(new URLSearchParams("locale=fr"))).toThrow();
  });
});
