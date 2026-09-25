"use client";

import { Compass, HomeIcon, MapIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { WeatherChip } from "@/components/layout/WeatherChip";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  const links = [
    { href: "/", label: t("home"), icon: HomeIcon },
    { href: "/tours", label: t("tours"), icon: MapIcon },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-4">
        <Link
          href="/"
          aria-label={t("brand")}
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <Compass aria-hidden className="size-5 shrink-0 text-primary" />
          <span className="hidden sm:inline">{t("brand")}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href ||
                  pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-label={link.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center rounded-md px-2.5 py-2 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/60 sm:px-3",
                  active
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <link.icon aria-hidden className="size-4 sm:hidden" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
          <LocaleSwitcher />
          <WeatherChip />
        </nav>
      </div>
    </header>
  );
}
