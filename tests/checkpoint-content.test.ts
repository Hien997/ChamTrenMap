import { describe, expect, it } from "vitest";

import {
  createCheckpointSchema,
  parseCheckpointCreateForm,
  parseCheckpointUpdateForm,
  toCheckpointDetail,
  toCheckpointSummary,
  updateCheckpointSchema,
  type AdminGuide,
  type CheckpointContentRow,
} from "@/services/checkpoint-content";

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) fd.set(key, value);
  return fd;
}

const FULL_PATCH_FIELDS = {
  latitude: "10.3864",
  longitude: "104.4835",
  radiusMeters: "100",
  estimatedVisitMinutes: "30",
  sortOrderHint: "0",
  priceKind: "TICKET",
  "vi.name": "Chùa Phù Dung",
  "vi.summary": "tóm tắt",
  "vi.address": "Hà Tiên",
  "en.name": "Phu Dung Pagoda",
  "en.summary": "summary",
  "en.address": "Ha Tien",
};

describe("parseCheckpointUpdateForm", () => {
  const currentGuides: AdminGuide[] = [
    { id: "g1", locale: "vi", content: "<h2>old</h2>", contentType: "HTML" },
  ];

  it("collects only locales with content, trims it and reuses existing ids", () => {
    const payload = parseCheckpointUpdateForm(
      formData({ "guide.vi.content": "  <h2>Giới thiệu</h2>  " }),
      currentGuides,
    );
    expect(payload.guides).toEqual([
      {
        id: "g1",
        locale: "vi",
        content: "<h2>Giới thiệu</h2>",
        contentType: "HTML",
      },
    ]);
  });

  it("emits an empty guides array when both locales are blank — replace-all still runs", () => {
    const payload = parseCheckpointUpdateForm(
      formData(FULL_PATCH_FIELDS),
      currentGuides,
    );
    expect(payload.guides).toEqual([]);
    const result = updateCheckpointSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("absent numeric fields stay undefined so zod rejects the PATCH with 400", () => {
    const payload = parseCheckpointUpdateForm(
      formData({ "vi.name": "n" }),
      [],
    );
    const result = updateCheckpointSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("garbage numbers become NaN and are rejected loudly — no silent defaults", () => {
    const payload = parseCheckpointUpdateForm(
      formData({ ...FULL_PATCH_FIELDS, latitude: "abc" }),
      [],
    );
    const result = updateCheckpointSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("empty price maps to null, filled price parses", () => {
    const withoutPrice = parseCheckpointUpdateForm(
      formData(FULL_PATCH_FIELDS),
      [],
    );
    expect(withoutPrice.priceVnd).toBeNull();
    const withPrice = parseCheckpointUpdateForm(
      formData({ ...FULL_PATCH_FIELDS, priceVnd: "120000" }),
      [],
    );
    expect(withPrice.priceVnd).toBe(120000);
  });
});

describe("parseCheckpointCreateForm", () => {
  const VALID_CREATE_FIELDS = {
    slug: "chua-phu-dung",
    latitude: "10.3864",
    longitude: "104.4835",
    "vi.name": "Chùa Phù Dung",
    "vi.summary": "tóm tắt",
    "vi.address": "Hà Tiên",
    "en.name": "Phu Dung Pagoda",
    "en.summary": "summary",
    "en.address": "Ha Tien",
  };

  it("absent numeric/kind fields resolve through the create defaults", () => {
    const payload = parseCheckpointCreateForm(formData(VALID_CREATE_FIELDS));
    const result = createCheckpointSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.radiusMeters).toBe(100);
      expect(result.data.estimatedVisitMinutes).toBe(30);
      expect(result.data.sortOrderHint).toBe(0);
      expect(result.data.priceKind).toBe("TICKET");
    }
  });

  it("a form missing translations is rejected — defaults never paper over gaps", () => {
    const payload = parseCheckpointCreateForm(
      formData({
        slug: "chua-phu-dung",
        latitude: "10.3864",
        longitude: "104.4835",
      }),
    );
    expect(createCheckpointSchema.safeParse(payload).success).toBe(false);
  });

  it("empty slug and garbage numbers fail the create schema", () => {
    expect(
      createCheckpointSchema.safeParse(parseCheckpointCreateForm(formData({})))
        .success,
    ).toBe(false);
    expect(
      createCheckpointSchema.safeParse(
        parseCheckpointCreateForm(formData({ slug: "x", latitude: "abc" })),
      ).success,
    ).toBe(false);
  });
});

const ROW: CheckpointContentRow = {
  id: "c1",
  slug: "chua-phu-dung",
  latitude: 10.3864,
  longitude: 104.4516,
  radiusMeters: 100,
  estimatedVisitMinutes: 30,
  priceVnd: 20000,
  priceKind: "FOOD",
  translations: [
    {
      locale: "en",
      name: "Phu Dung Pagoda",
      summary: "summary",
      address: "Ha Tien",
      openingHours: null,
      bestTimeToVisit: null,
    },
  ],
  images: [
    { url: "first.png", alt: null, isThumbnail: false },
    { url: "thumb.png", alt: "alt", isThumbnail: true },
  ],
  guides: [{ locale: "vi", content: "<h2>guide</h2>", contentType: "HTML" }],
};

describe("toCheckpointDetail", () => {
  it("falls back through pickLocalized and maps kinds and thumbnails", () => {
    const view = toCheckpointDetail(ROW, "vi");
    expect(view.name).toBe("Phu Dung Pagoda");
    expect(view.priceKind).toBe("food");
    expect(view.thumbnailUrl).toBe("thumb.png");
    expect(view.images).toEqual([
      { url: "first.png", alt: null },
      { url: "thumb.png", alt: "alt" },
    ]);
    expect(view.guides).toEqual([
      { locale: "vi", content: "<h2>guide</h2>", contentType: "HTML" },
    ]);
  });

  it("uses the slug as name when no translation exists at all", () => {
    const view = toCheckpointDetail({ ...ROW, translations: [] }, "vi");
    expect(view.name).toBe("chua-phu-dung");
    expect(view.summary).toBe("");
  });
});

describe("toCheckpointSummary", () => {
  it("projects the marker list shape", () => {
    expect(toCheckpointSummary(ROW, "en")).toEqual({
      id: "c1",
      slug: "chua-phu-dung",
      latitude: 10.3864,
      longitude: 104.4516,
      name: "Phu Dung Pagoda",
      summary: "summary",
      thumbnailUrl: "first.png",
    });
  });
});
