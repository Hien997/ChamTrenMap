import { describe, expect, it } from "vitest";
import { deriveStatuses } from "@/services/progress-status";

const ids = ["cp1", "cp2", "cp3", "cp4"];

describe("deriveStatuses (sequential tour)", () => {
  it("marks the first checkpoint current on a fresh tour", () => {
    const r = deriveStatuses(ids, []);
    expect(r.currentCheckpointId).toBe("cp1");
    expect(r.isCompleted).toBe(false);
    expect(r.statuses.get("cp1")).toBe("current");
    expect(r.statuses.get("cp2")).toBe("locked");
    expect(r.statuses.get("cp4")).toBe("locked");
  });

  it("marks completed checkpoints and the next one current", () => {
    const r = deriveStatuses(ids, ["cp1", "cp2"]);
    expect(r.statuses.get("cp1")).toBe("completed");
    expect(r.statuses.get("cp2")).toBe("completed");
    expect(r.currentCheckpointId).toBe("cp3");
    expect(r.statuses.get("cp3")).toBe("current");
    expect(r.statuses.get("cp4")).toBe("locked");
  });

  it("completes the tour when every checkpoint has a check-in", () => {
    const r = deriveStatuses(ids, ids);
    expect(r.isCompleted).toBe(true);
    expect(r.currentCheckpointId).toBeNull();
    expect([...r.statuses.values()].every((s) => s === "completed")).toBe(true);
  });

  it("ignores completed ids that do not belong to the tour", () => {
    const r = deriveStatuses(ids, ["cp2", "unknown"]);
    expect(r.statuses.get("cp2")).toBe("completed");
    expect(r.currentCheckpointId).toBe("cp1");
  });

  it("treats an empty tour as not completed", () => {
    const r = deriveStatuses([], []);
    expect(r.isCompleted).toBe(false);
    expect(r.currentCheckpointId).toBeNull();
  });
});
