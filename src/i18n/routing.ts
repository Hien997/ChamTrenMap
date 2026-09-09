import { defineRouting } from "next-intl/routing";

/** Central routing config (Plan.md §9): /vi/... and /en/..., Vietnamese default. */
export const routing = defineRouting({
  locales: ["vi", "en"],
  defaultLocale: "vi",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];
