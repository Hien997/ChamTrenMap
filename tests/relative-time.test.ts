import { describe, expect, it } from "vitest";

import { formatRelativeTime } from "@/lib/relative-time";

const now = new Date("2026-01-15T12:00:00.000Z");
const ago = (ms: number): Date => new Date(now.getTime() - ms);

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatRelativeTime", () => {
  it("renders seconds as 'just now'", () => {
    expect(formatRelativeTime(ago(45_000), now)).toBe("just now");
  });

  it("renders whole minutes under an hour", () => {
    expect(formatRelativeTime(ago(3 * MINUTE), now)).toBe("3 min ago");
    expect(formatRelativeTime(ago(59 * MINUTE), now)).toBe("59 min ago");
  });

  it("renders whole hours under a day", () => {
    expect(formatRelativeTime(ago(2 * HOUR), now)).toBe("2 hours ago");
  });

  it("renders whole days under a week", () => {
    expect(formatRelativeTime(ago(3 * DAY), now)).toBe("3 days ago");
  });

  it("falls back to an absolute date beyond a week", () => {
    const old = ago(30 * DAY);
    const out = formatRelativeTime(old, now);
    // Not relative any more — a concrete calendar date, so the admin can place it.
    expect(out).not.toContain("ago");
    expect(out).not.toContain("just now");
    expect(out.length).toBeGreaterThan(0);
  });

  it("treats a future timestamp as 'just now' (clock skew tolerance)", () => {
    const future = new Date(now.getTime() + 10 * MINUTE);
    expect(formatRelativeTime(future, now)).toBe("just now");
  });
});
