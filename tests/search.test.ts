import { describe, expect, it } from "vitest";

import {
  buildCheckpointSearchWhere,
  buildTourSearchWhere,
} from "@/services/search";

describe("buildTourSearchWhere", () => {
  it("returns no filter for an empty query", () => {
    expect(buildTourSearchWhere("")).toEqual({});
  });

  it("matches the slug or either locale's name, case-insensitively", () => {
    expect(buildTourSearchWhere("Cafe")).toEqual({
      OR: [
        { slug: { contains: "Cafe", mode: "insensitive" } },
        {
          translations: {
            some: { name: { contains: "Cafe", mode: "insensitive" } },
          },
        },
      ],
    });
  });
});

describe("buildCheckpointSearchWhere", () => {
  it("returns no filter for an empty query", () => {
    expect(buildCheckpointSearchWhere("")).toEqual({});
  });

  it("matches the slug or either locale's name, case-insensitively", () => {
    expect(buildCheckpointSearchWhere("Cafe")).toEqual({
      OR: [
        { slug: { contains: "Cafe", mode: "insensitive" } },
        {
          translations: {
            some: { name: { contains: "Cafe", mode: "insensitive" } },
          },
        },
      ],
    });
  });
});
