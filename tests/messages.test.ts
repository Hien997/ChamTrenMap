import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function loadCatalog(name: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(
      new URL(`../src/messages/${name}.json`, import.meta.url),
      "utf8",
    ),
  ) as Record<string, unknown>;
}

/** Leaf key paths, e.g. "Map.loadingMap". */
function flattenKeys(node: unknown, prefix = ""): string[] {
  if (typeof node !== "object" || node === null) {
    return prefix ? [prefix] : [];
  }
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
    flattenKeys(value, prefix ? `${prefix}.${key}` : key),
  );
}

describe("message catalogs", () => {
  const vi = flattenKeys(loadCatalog("vi"));
  const en = flattenKeys(loadCatalog("en"));

  it("en covers every vi key (vi is the source of truth)", () => {
    const missing = vi.filter((key) => !en.includes(key));
    expect(missing).toEqual([]);
  });

  it("en declares no keys beyond vi", () => {
    const extra = en.filter((key) => !vi.includes(key));
    expect(extra).toEqual([]);
  });
});
