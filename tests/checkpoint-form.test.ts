import { describe, expect, it } from "vitest";

import {
  CREATE_DEFAULT_VALUES,
  createCheckpointFormSchema,
  editDefaultValues,
  isCheckpointFormPath,
  updateCheckpointFormSchema,
} from "@/lib/checkpoint-form";
import type { AdminCheckpoint } from "@/services/checkpoint-content";

/** The create form's registered shape — flat strings, nested locales/guides. */
const VALID_VALUES = {
  slug: "chua-phu-dung",
  latitude: "10.3864",
  longitude: "104.4835",
  radiusMeters: "100",
  estimatedVisitMinutes: "30",
  sortOrderHint: "0",
  priceVnd: "",
  priceKind: "TICKET",
  vi: {
    name: "Chùa Phù Dung",
    summary: "tóm tắt",
    address: "Hà Tiên",
    openingHours: "",
    bestTimeToVisit: "",
  },
  en: {
    name: "Phu Dung Pagoda",
    summary: "summary",
    address: "Ha Tien",
    openingHours: "",
    bestTimeToVisit: "",
  },
  guide: { vi: { content: "  <h2>Giới thiệu</h2>  " }, en: { content: "   " } },
};

describe("createCheckpointFormSchema", () => {
  it("turns registered form values into the API payload", () => {
    const result = createCheckpointFormSchema.safeParse(VALID_VALUES);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.slug).toBe("chua-phu-dung");
    expect(result.data.latitude).toBe(10.3864);
    expect(result.data.radiusMeters).toBe(100);
    expect(result.data.priceVnd).toBeNull();
    expect(result.data.guides).toEqual([
      { locale: "vi", content: "<h2>Giới thiệu</h2>", contentType: "HTML" },
    ]);
  });

  it("re-attaches schema issues at their dotted form paths for inline display", () => {
    const result = createCheckpointFormSchema.safeParse({
      ...VALID_VALUES,
      slug: "",
      latitude: "120",
      vi: { ...VALID_VALUES.vi, name: "" },
    });
    expect(result.success).toBe(false);
    if (result.success) return;

    const messages = Object.fromEntries(
      result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
    );
    expect(messages.slug).toBe("Slug is required.");
    expect(messages.latitude).toBe("Latitude must be between -90 and 90.");
    expect(messages["vi.name"]).toBe("Name is required.");
  });
});

describe("updateCheckpointFormSchema", () => {
  it("binds id/slug and re-attaches guide ids into the PATCH payload", () => {
    const schema = updateCheckpointFormSchema({
      id: "cabc123456",
      slug: "chua-phu-dung",
      guides: [
        {
          id: "g1",
          locale: "vi",
          content: "<h2>old</h2>",
          contentType: "HTML",
        },
      ],
    });
    const result = schema.safeParse(VALID_VALUES);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.id).toBe("cabc123456");
    expect(result.data.slug).toBe("chua-phu-dung");
    expect(result.data.guides).toEqual([
      {
        id: "g1",
        locale: "vi",
        content: "<h2>Giới thiệu</h2>",
        contentType: "HTML",
      },
    ]);
  });
});

describe("editDefaultValues", () => {
  const CHECKPOINT: AdminCheckpoint = {
    id: "cabc123456",
    slug: "chua-phu-dung",
    latitude: 10.3864,
    longitude: 104.4516,
    radiusMeters: 100,
    estimatedVisitMinutes: 30,
    sortOrderHint: 0,
    priceVnd: 20000,
    priceKind: "FOOD",
    vi: {
      name: "Chùa Phù Dung",
      summary: "tóm tắt",
      address: "Hà Tiên",
      openingHours: null,
      bestTimeToVisit: null,
    },
    en: null,
    guides: [
      {
        id: "g1",
        locale: "vi",
        content: "<h2>guide</h2>",
        contentType: "HTML",
      },
    ],
  };

  it("flattens stored fields into strings (nulls → empty, guides seeded)", () => {
    expect(editDefaultValues(CHECKPOINT)).toMatchObject({
      latitude: "10.3864",
      radiusMeters: "100",
      priceVnd: "20000",
      priceKind: "FOOD",
      vi: { name: "Chùa Phù Dung", openingHours: "" },
      en: { name: "", summary: "", address: "" },
      guide: { vi: { content: "<h2>guide</h2>" }, en: { content: "" } },
    });
  });

  it("ships the pinned create defaults", () => {
    expect(CREATE_DEFAULT_VALUES).toMatchObject({
      latitude: "10.3864",
      longitude: "104.4516",
      radiusMeters: "100",
      priceKind: "TICKET",
    });
  });
});

describe("isCheckpointFormPath", () => {
  it("lets only registered roots reach setError", () => {
    expect(isCheckpointFormPath("vi.name")).toBe(true);
    expect(isCheckpointFormPath("slug")).toBe(true);
    expect(isCheckpointFormPath("guides.0.content")).toBe(false);
    expect(isCheckpointFormPath("")).toBe(false);
  });
});
