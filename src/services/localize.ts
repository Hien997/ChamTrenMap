import type { Locale } from "@/config/constants";

export interface LocalizedRow {
  locale: string;
}

/**
 * Pick the translation row for `locale`, falling back to Vietnamese (the
 * content source of truth) and finally to whatever row exists.
 */
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
