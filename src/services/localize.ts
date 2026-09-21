import type { Locale } from "@/config/constants";

export interface LocalizedRow {
  locale: string;
}

export function pickLocalized<T extends LocalizedRow>(
  rows: T[],
  locale: Locale,
): T | undefined {
  return (
    rows.find((row) => row.locale === locale) ??
    rows.find((row) => row.locale === "vi") ??
    rows[0]
  );
}
