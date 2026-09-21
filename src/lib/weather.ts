export const HATIEN_LATITUDE = 10.3836;
export const HATIEN_LONGITUDE = 104.4835;

export const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";

export const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000;
export const WEATHER_CACHE_KEY = "ctm:weather-hatien:v1";

export type WeatherKind =
  | "clear"
  | "partly-cloudy"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "storm"
  | "snow";

export function weatherKindForCode(code: number): WeatherKind {
  if (!Number.isFinite(code)) return "overcast";
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly-cloudy";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code >= 95 && code <= 99) return "storm";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  return "overcast";
}

export type WeatherDay = {
  date: string;
  kind: WeatherKind;
  highC: number;
  lowC: number;
  rainChance: number | null;
};

export type HatienWeather = {
  currentTempC: number;
  currentKind: WeatherKind;
  days: WeatherDay[];
  fetchedAt: number;
};

type OpenMeteoResponse = {
  current?: { temperature_2m?: unknown; weather_code?: unknown };
  daily?: {
    time?: unknown;
    weather_code?: unknown;
    temperature_2m_max?: unknown;
    temperature_2m_min?: unknown;
    precipitation_probability_max?: unknown;
  };
};

function toFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toFiniteArray(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  if (!value.every((v) => typeof v === "number" && Number.isFinite(v)))
    return null;
  return value as number[];
}

export function parseHatienWeather(
  payload: unknown,
  now: number = Date.now(),
): HatienWeather | null {
  if (typeof payload !== "object" || payload === null) return null;
  const data = payload as OpenMeteoResponse;

  const currentTempC = toFiniteNumber(data.current?.temperature_2m);
  const currentCode = toFiniteNumber(data.current?.weather_code);
  const times = Array.isArray(data.daily?.time)
    ? (data.daily.time as unknown[])
    : null;
  const codes = toFiniteArray(data.daily?.weather_code);
  const highs = toFiniteArray(data.daily?.temperature_2m_max);
  const lows = toFiniteArray(data.daily?.temperature_2m_min);
  const rainRaw = data.daily?.precipitation_probability_max;
  const rains: (number | null)[] | null | "invalid" =
    rainRaw === undefined || rainRaw === null
      ? null
      : Array.isArray(rainRaw) &&
          rainRaw.every(
            (v) => v === null || (typeof v === "number" && Number.isFinite(v)),
          )
        ? (rainRaw as (number | null)[])
        : "invalid";

  if (
    currentTempC === null ||
    currentCode === null ||
    times === null ||
    codes === null ||
    highs === null ||
    lows === null ||
    rains === "invalid" ||
    times.length === 0 ||
    codes.length !== times.length ||
    highs.length !== times.length ||
    lows.length !== times.length ||
    (rains !== null && rains.length !== times.length) ||
    !times.every((t) => typeof t === "string")
  ) {
    return null;
  }

  const days: WeatherDay[] = (times as string[]).map((date, i) => ({
    date,
    kind: weatherKindForCode(codes[i]),
    highC: Math.round(highs[i]),
    lowC: Math.round(lows[i]),
    rainChance:
      rains === null || rains[i] === null ? null : Math.round(rains[i] as number),
  }));

  return {
    currentTempC: Math.round(currentTempC),
    currentKind: weatherKindForCode(currentCode),
    days,
    fetchedAt: now,
  };
}

export function buildWeatherUrl(): string {
  const params = new URLSearchParams({
    latitude: String(HATIEN_LATITUDE),
    longitude: String(HATIEN_LONGITUDE),
    current: "temperature_2m,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "Asia/Ho_Chi_Minh",
    forecast_days: "7",
  });
  return `${WEATHER_API_URL}?${params.toString()}`;
}

function readStoredPayload(): { parsed: HatienWeather; fetchedAt: number } | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    const json = JSON.parse(raw) as { fetchedAt?: unknown };
    const fetchedAt = toFiniteNumber(json.fetchedAt) ?? 0;
    const parsed = parseHatienWeather(json, fetchedAt);
    return parsed ? { parsed, fetchedAt } : null;
  } catch {
    return null;
  }
}

function writeCache(weather: HatienWeather): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weather));
  } catch {
    // Private mode / quota — weather just refetches next mount.
  }
}

export async function fetchHatienWeather(
  now: number = Date.now(),
): Promise<HatienWeather | null> {
  const stored = readStoredPayload();
  if (stored && now - stored.fetchedAt <= WEATHER_CACHE_TTL_MS) {
    return stored.parsed;
  }

  try {
    const response = await fetch(buildWeatherUrl());
    if (!response.ok) return stored?.parsed ?? null;
    const parsed = parseHatienWeather(await response.json(), now);
    if (!parsed) return stored?.parsed ?? null;
    writeCache(parsed);
    return parsed;
  } catch {
    return stored?.parsed ?? null;
  }
}
