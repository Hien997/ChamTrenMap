import { describe, expect, it } from "vitest";

import {
  buildWeatherUrl,
  parseHatienWeather,
  weatherKindForCode,
} from "@/lib/weather";

function payload(overrides = {}) {
  return {
    current: { temperature_2m: 29.4, weather_code: 2 },
    daily: {
      time: ["2026-09-18", "2026-09-19"],
      weather_code: [2, 61],
      temperature_2m_max: [31.6, 30.2],
      temperature_2m_min: [25.3, 24.8],
      precipitation_probability_max: [10, 80],
    },
    ...overrides,
  };
}

describe("weatherKindForCode", () => {
  it("maps every documented WMO group", () => {
    expect(weatherKindForCode(0)).toBe("clear");
    expect(weatherKindForCode(1)).toBe("partly-cloudy");
    expect(weatherKindForCode(2)).toBe("partly-cloudy");
    expect(weatherKindForCode(3)).toBe("overcast");
    expect(weatherKindForCode(45)).toBe("fog");
    expect(weatherKindForCode(48)).toBe("fog");
    expect(weatherKindForCode(51)).toBe("drizzle");
    expect(weatherKindForCode(57)).toBe("drizzle");
    expect(weatherKindForCode(61)).toBe("rain");
    expect(weatherKindForCode(65)).toBe("rain");
    expect(weatherKindForCode(80)).toBe("rain");
    expect(weatherKindForCode(82)).toBe("rain");
    expect(weatherKindForCode(95)).toBe("storm");
    expect(weatherKindForCode(99)).toBe("storm");
    expect(weatherKindForCode(71)).toBe("snow");
    expect(weatherKindForCode(86)).toBe("snow");
  });

  it("falls back to overcast instead of throwing", () => {
    expect(weatherKindForCode(12345)).toBe("overcast");
    expect(weatherKindForCode(Number.NaN)).toBe("overcast");
  });
});

describe("parseHatienWeather", () => {
  it("parses a full payload and rounds temperatures", () => {
    const parsed = parseHatienWeather(payload(), 1000);
    expect(parsed).toMatchObject({
      currentTempC: 29,
      currentKind: "partly-cloudy",
      fetchedAt: 1000,
    });
    expect(parsed?.days).toEqual([
      {
        date: "2026-09-18",
        kind: "partly-cloudy",
        highC: 32,
        lowC: 25,
        rainChance: 10,
      },
      { date: "2026-09-19", kind: "rain", highC: 30, lowC: 25, rainChance: 80 },
    ]);
  });

  it("tolerates a missing rain array (null chances)", () => {
    const { precipitation_probability_max: _drop, ...rest } = payload()
      .daily as Record<string, unknown>;
    void _drop;
    const parsed = parseHatienWeather({ ...payload(), daily: rest });
    expect(parsed?.days[0].rainChance).toBeNull();
  });

  it("rejects degenerate payloads instead of rendering half a forecast", () => {
    expect(parseHatienWeather(null)).toBeNull();
    expect(parseHatienWeather({})).toBeNull();
    expect(parseHatienWeather(payload({ current: null }))).toBeNull();
    expect(
      parseHatienWeather(
        payload({ daily: { ...payload().daily, temperature_2m_max: [30] } }),
      ),
    ).toBeNull();
    expect(parseHatienWeather(payload(), Number.NaN)).not.toBeNull();
  });
});

describe("buildWeatherUrl", () => {
  it("pins the Hà Tiên request contract", () => {
    const url = new URL(buildWeatherUrl());
    expect(url.origin + url.pathname).toBe(
      "https://api.open-meteo.com/v1/forecast",
    );
    expect(url.searchParams.get("latitude")).toBe("10.3836");
    expect(url.searchParams.get("longitude")).toBe("104.4835");
    expect(url.searchParams.get("current")).toBe("temperature_2m,weather_code");
    expect(url.searchParams.get("forecast_days")).toBe("7");
    expect(url.searchParams.get("timezone")).toBe("Asia/Ho_Chi_Minh");
  });
});
