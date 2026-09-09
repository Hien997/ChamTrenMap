/**
 * Human-friendly distance formatting. Uses next-intl message keys from the
 * `Common` namespace ("meters" / "kilometers").
 */
export function formatDistance(
  meters: number,
  translate: (key: string, values?: Record<string, number | string>) => string,
): string {
  if (meters >= 1000) {
    return translate("kilometers", { distance: Number((meters / 1000).toFixed(1)) });
  }
  return translate("meters", { distance: Math.round(meters) });
}
