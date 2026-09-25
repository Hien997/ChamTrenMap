export function formatDistance(
  meters: number,
  translate: (key: string, values?: Record<string, number | string>) => string,
): string {
  if (meters >= 1000) {
    return translate("kilometers", {
      distance: Number((meters / 1000).toFixed(1)),
    });
  }
  return translate("meters", { distance: Math.round(meters) });
}

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}
