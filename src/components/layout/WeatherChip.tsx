"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ChevronDownIcon,
  CloudDrizzleIcon,
  CloudFogIcon,
  CloudIcon,
  CloudLightningIcon,
  CloudRainIcon,
  CloudSnowIcon,
  CloudSunIcon,
  DropletsIcon,
  SunIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  fetchHatienWeather,
  type HatienWeather,
  type WeatherKind,
} from "@/lib/weather";

const KIND_ICONS = {
  clear: SunIcon,
  "partly-cloudy": CloudSunIcon,
  overcast: CloudIcon,
  fog: CloudFogIcon,
  drizzle: CloudDrizzleIcon,
  rain: CloudRainIcon,
  storm: CloudLightningIcon,
  snow: CloudSnowIcon,
} as const;

const KIND_TINT: Record<WeatherKind, string> = {
  clear: "text-amber-500 dark:text-amber-300",
  "partly-cloudy": "text-amber-600/80 dark:text-amber-200/90",
  overcast: "text-slate-500 dark:text-slate-300",
  fog: "text-stone-400 dark:text-stone-300",
  drizzle: "text-sky-500 dark:text-sky-300",
  rain: "text-sky-600 dark:text-sky-400",
  storm: "text-violet-600 dark:text-violet-300",
  snow: "text-cyan-600 dark:text-cyan-200",
};

function KindIcon({
  kind,
  className,
}: {
  kind: WeatherKind;
  className?: string;
}) {
  const Icon = KIND_ICONS[kind];
  return (
    <Icon aria-hidden className={cn(KIND_TINT[kind], className ?? "size-4")} />
  );
}

const weekdayFormatters = new Map<string, Intl.DateTimeFormat>();

function shortWeekday(dateIso: string, locale: string): string {
  const date = new Date(`${dateIso}T12:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return dateIso;
  const tag = locale === "vi" ? "vi-VN" : "en-US";
  let formatter = weekdayFormatters.get(tag);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(tag, {
      weekday: "short",
      timeZone: "Asia/Ho_Chi_Minh",
    });
    weekdayFormatters.set(tag, formatter);
  }
  return formatter.format(date);
}

export function WeatherChip() {
  const t = useTranslations("Weather");
  const locale = useLocale();
  const [weather, setWeather] = useState<HatienWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHatienWeather().then((result) => {
      if (cancelled) return;
      setWeather(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!loading && !weather) return null;

  const chipLabel = weather
    ? t("todayLabel", { temp: weather.currentTempC })
    : t("loadingLabel");

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          weather
            ? t("openForecast", { temp: weather.currentTempC })
            : chipLabel
        }
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-md px-2 text-sm transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/60",
          open ? "bg-accent text-accent-foreground" : "text-muted-foreground",
        )}
      >
        {loading || !weather ? (
          <span
            aria-hidden
            className="h-4 w-12 animate-pulse rounded bg-muted"
          />
        ) : (
          <>
            <KindIcon kind={weather.currentKind} className="size-4 shrink-0" />
            <span className="font-medium tabular-nums">
              {weather.currentTempC}°
            </span>
          </>
        )}
        <ChevronDownIcon
          aria-hidden
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && weather && (
        <div
          role="dialog"
          aria-label={t("weekTitle")}
          className="absolute top-full right-0 z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border bg-card p-2 shadow-lg"
        >
          <p className="px-2 pt-1 pb-2 text-xs font-medium text-muted-foreground">
            {t("weekTitle")}
          </p>
          <ul className="flex flex-col">
            {weather.days.map((day, i) => (
              <li
                key={day.date}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
                  i === 0 && "bg-accent/60 font-medium",
                )}
              >
                {/* Fixed columns stay narrow, so the panel can never be pushed
                    past its clamp by a locale's long weekday or a wide number. */}
                <span className="w-12 shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground">
                  {i === 0 ? t("today") : shortWeekday(day.date, locale)}
                </span>
                <KindIcon kind={day.kind} className="size-4 shrink-0" />
                <span className="ml-auto font-medium tabular-nums">
                  {day.highC}°
                </span>
                <span className="w-8 shrink-0 text-right text-muted-foreground tabular-nums">
                  {day.lowC}°
                </span>
                <span className="flex w-11 shrink-0 items-center justify-end gap-0.5 overflow-hidden text-xs whitespace-nowrap text-sky-600 tabular-nums dark:text-sky-400">
                  {day.rainChance !== null && day.rainChance >= 20 && (
                    <>
                      <DropletsIcon aria-hidden className="size-3 shrink-0" />
                      {day.rainChance}%
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
