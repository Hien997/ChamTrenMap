import { describe, expect, it } from "vitest";
import { evaluateCheckIn, haversineMeters } from "@/lib/geo";

describe("haversineMeters", () => {
  it("returns 0 for identical points", () => {
    const p = { latitude: 10.3826, longitude: 104.4835 };
    expect(haversineMeters(p, p)).toBe(0);
  });

  it("measures 100 m of pure latitude within 0.5 m", () => {
    // 1° of latitude ≈ 111,195 m (WGS84 mean) → 100 m ≈ 0.00089933°
    const a = { latitude: 10, longitude: 104.5 };
    const b = { latitude: 10 + 100 / 111_195, longitude: 104.5 };
    const d = haversineMeters(a, b);
    expect(d).toBeGreaterThan(99.5);
    expect(d).toBeLessThan(100.5);
  });

  it("computes the Hà Tiên town → Mũi Nai seed distance (~2.7 km)", () => {
    const town = { latitude: 10.3826, longitude: 104.4835 };
    const muiNai = { latitude: 10.3899, longitude: 104.5072 };
    const d = haversineMeters(town, muiNai);
    expect(d).toBeGreaterThan(2_400);
    expect(d).toBeLessThan(3_000);
  });
});

describe("evaluateCheckIn", () => {
  const base = {
    distanceMeters: 32,
    accuracyMeters: 12,
    radiusMeters: 100,
    maxAccuracyMeters: 100,
    alreadyCheckedIn: false,
    isLocked: false,
  };

  it("allows a check-in inside the radius with good accuracy", () => {
    expect(evaluateCheckIn(base)).toEqual({ status: "ok" });
  });

  it("rejects duplicate check-ins before any other rule", () => {
    const decision = evaluateCheckIn({
      ...base,
      alreadyCheckedIn: true,
      distanceMeters: 5_000,
    });
    expect(decision).toEqual({ status: "already_checked_in" });
  });

  it("rejects locked checkpoints before distance/accuracy rules", () => {
    const decision = evaluateCheckIn({
      ...base,
      isLocked: true,
      distanceMeters: 5_000,
      accuracyMeters: 500,
    });
    expect(decision).toEqual({ status: "locked" });
  });

  it("rejects poor GPS accuracy even when inside the radius", () => {
    const decision = evaluateCheckIn({ ...base, accuracyMeters: 150 });
    expect(decision).toEqual({
      status: "poor_accuracy",
      accuracy: 150,
      maxAccuracy: 100,
    });
  });

  it("tolerates a missing accuracy value (some browsers omit it)", () => {
    expect(evaluateCheckIn({ ...base, accuracyMeters: null })).toEqual({
      status: "ok",
    });
  });

  it("rejects when outside the geofence radius", () => {
    const decision = evaluateCheckIn({ ...base, distanceMeters: 850.4 });
    expect(decision).toEqual({
      status: "too_far",
      distanceMeters: 850.4,
      radiusMeters: 100,
    });
  });

  it("accepts exactly on the boundary (distance == radius)", () => {
    expect(evaluateCheckIn({ ...base, distanceMeters: 100 })).toEqual({
      status: "ok",
    });
  });
});
