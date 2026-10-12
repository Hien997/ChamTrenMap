import { describe, expect, it } from "vitest";

import {
  CHECKIN_QUEUE_KEY,
  enqueueCheckIn,
  isNetworkError,
  readCheckInQueue,
  removeCheckIn,
  type StorageLike,
} from "@/lib/checkin-queue";

const memoryStorage = (initial?: string): StorageLike & { data: string[] } => {
  const data: string[] = [];
  if (initial !== undefined) {
    data.push(initial);
  }
  return {
    data,
    getItem: (key) => (key === CHECKIN_QUEUE_KEY ? (data[0] ?? null) : null),
    setItem: (key, value) => {
      if (key === CHECKIN_QUEUE_KEY) {
        data[0] = value;
      }
    },
  };
};

const payload = {
  checkpointId: "cp-1",
  latitude: 10.28,
  longitude: 104.49,
  accuracy: 12,
  locale: "vi",
};

describe("readCheckInQueue", () => {
  it("returns an empty queue when nothing is stored", () => {
    expect(readCheckInQueue(memoryStorage())).toEqual([]);
  });

  it("never throws on corrupt storage — a bad value must not break the page", () => {
    expect(readCheckInQueue(memoryStorage("not json"))).toEqual([]);
    expect(readCheckInQueue(memoryStorage('{"not":"an array"}'))).toEqual([]);
    expect(readCheckInQueue(memoryStorage("[1,2,3]"))).toEqual([]);
  });

  it("drops entries that are missing the fields a replay needs", () => {
    const storage = memoryStorage(
      JSON.stringify([
        { ...payload, id: "a", queuedAt: 1, latitude: "north" },
        { ...payload, id: "b", queuedAt: 2 },
        { ...payload, id: "c", queuedAt: 3, latitude: 1.5, longitude: 2.5 },
      ]),
    );
    expect(readCheckInQueue(storage).map((entry) => entry.id)).toEqual([
      "b",
      "c",
    ]);
  });
});

describe("enqueueCheckIn", () => {
  it("persists one entry that reads back intact", () => {
    const storage = memoryStorage();
    expect(enqueueCheckIn(storage, { ...payload, id: "x", queuedAt: 7 })).toBe(
      1,
    );

    expect(readCheckInQueue(storage)).toEqual([
      { ...payload, id: "x", queuedAt: 7 },
    ]);
  });

  it("appends rather than overwriting, so a second offline stop survives", () => {
    const storage = memoryStorage();
    enqueueCheckIn(storage, { ...payload, id: "a", queuedAt: 1 });
    enqueueCheckIn(storage, {
      ...payload,
      checkpointId: "cp-2",
      id: "b",
      queuedAt: 2,
    });

    expect(readCheckInQueue(storage)).toHaveLength(2);
    expect(
      readCheckInQueue(storage).map((entry) => entry.checkpointId),
    ).toEqual(["cp-1", "cp-2"]);
  });

  it("keeps a queue that already exists when storage arrives mid-session", () => {
    const storage = memoryStorage(
      JSON.stringify([{ ...payload, id: "old", queuedAt: 1 }]),
    );
    enqueueCheckIn(storage, { ...payload, id: "new", queuedAt: 2 });

    expect(readCheckInQueue(storage).map((entry) => entry.id)).toEqual([
      "old",
      "new",
    ]);
  });
});

describe("removeCheckIn", () => {
  it("removes only the entry the server has answered", () => {
    const storage = memoryStorage();
    enqueueCheckIn(storage, { ...payload, id: "a", queuedAt: 1 });
    enqueueCheckIn(storage, { ...payload, id: "b", queuedAt: 2 });

    expect(removeCheckIn(storage, "a").map((entry) => entry.id)).toEqual(["b"]);
    expect(readCheckInQueue(storage)).toHaveLength(1);
  });

  it("leaves the stored value well-formed when the last entry goes", () => {
    const storage = memoryStorage();
    enqueueCheckIn(storage, { ...payload, id: "a", queuedAt: 1 });

    expect(removeCheckIn(storage, "a")).toEqual([]);
    expect(readCheckInQueue(storage)).toEqual([]);
  });
});

describe("isNetworkError", () => {
  it("treats fetch transport failures as offline", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isNetworkError(new SyntaxError("Unexpected token <"))).toBe(true);
  });

  it("does not swallow errors the server actually caused", () => {
    expect(isNetworkError(new Error("boom"))).toBe(false);
    expect(isNetworkError("string")).toBe(false);
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });
});
