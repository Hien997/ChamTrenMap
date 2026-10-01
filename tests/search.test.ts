import { describe, expect, it } from "vitest";

import {
  buildCheckpointSearchWhere,
  buildPrivateTourSearchWhere,
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

describe("buildPrivateTourSearchWhere", () => {
  it("returns no filter for an empty query", () => {
    expect(buildPrivateTourSearchWhere("")).toEqual({});
  });

  it("matches the code, the customer name, or either locale's name", () => {
    // No slug: a private tour has none — the admin searches by what the
    // customer said on the phone.
    expect(buildPrivateTourSearchWhere("Nguyen")).toEqual({
      OR: [
        { code: { contains: "Nguyen", mode: "insensitive" } },
        { customerName: { contains: "Nguyen", mode: "insensitive" } },
        {
          translations: {
            some: { name: { contains: "Nguyen", mode: "insensitive" } },
          },
        },
      ],
    });
  });

  it("normalizes a typed phone number, because the column is stored normalized", () => {
    expect(buildPrivateTourSearchWhere("+84 912 345 678")).toEqual({
      OR: [
        { code: { contains: "+84 912 345 678", mode: "insensitive" } },
        { customerName: { contains: "+84 912 345 678", mode: "insensitive" } },
        { customerPhone: { contains: "0912345678" } },
        {
          translations: {
            some: {
              name: { contains: "+84 912 345 678", mode: "insensitive" },
            },
          },
        },
      ],
    });
  });

  it("never falls back to an empty `contains`, which would match every row", () => {
    for (const term of ["Nguyen", "Cafe"]) {
      const where = buildPrivateTourSearchWhere(term);
      for (const branch of where.OR ?? []) {
        expect(JSON.stringify(branch)).not.toContain('"contains":""');
      }
    }
  });
});
