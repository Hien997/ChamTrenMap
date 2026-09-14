"use client";

import { Compass } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { cn } from "@/lib/utils";

/** Sticky top navigation for all standard (non-map) pages. */
export function SiteHeader() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  const links = [
    { href: "/", label: t("home") },
    { href: "/tours", label: t("tours") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <Compass aria-hidden className="size-5 text-primary" />
          <span>{t("brand")}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/" || pathname === "/vi" || pathname === "/en"
                : pathname.startsWith(link.href) ||
                  pathname.startsWith(`/vi${link.href}`) ||
                  pathname.startsWith(`/en${link.href}`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground",
                  active
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
