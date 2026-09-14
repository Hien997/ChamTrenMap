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

/**
 * VND currency formatting for tour prices ("120.000 ₫"). Locale is Vietnamese
 * by design — the ₫ symbol and dot grouping are understood by both catalogs.
 */
export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}
