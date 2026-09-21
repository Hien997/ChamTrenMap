"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const OPTIONS: { value: AppLocale; code: string }[] = [
  { value: "vi", code: "VI" },
  { value: "en", code: "EN" },
];

export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="flex items-center rounded-lg bg-muted p-0.5 ring-1 ring-foreground/5"
    >
      {OPTIONS.map((option) => {
        const active = option.value === locale;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-label={t(option.value)}
            onClick={() => {
              if (!active) router.replace(pathname, { locale: option.value });
            }}
            className={cn(
              "flex h-7 cursor-pointer items-center rounded-md px-2.5 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
              active
                ? "bg-card font-medium text-foreground shadow-sm ring-1 ring-foreground/10"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="sm:hidden" aria-hidden="true">
              {option.code}
            </span>
            <span className="hidden sm:inline">{t(option.value)}</span>
          </button>
        );
      })}
    </div>
  );
}
