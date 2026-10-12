import { CompassIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * Shared footer for the public pages.
 *
 * Was a hardcoded Vietnamese one-liner on the home page only — invisible to the
 * `/en` locale and a dead end for internal linking. Nav keys are reused rather
 * than duplicated so the header and footer can never drift apart.
 */
export const SiteFooter = async () => {
  const t = await getTranslations("Footer");
  const tNav = await getTranslations("Nav");
  const links = [
    { href: "/", label: tNav("home") },
    { href: "/tours", label: tNav("tours") },
  ] as const;

  return (
    <footer className="border-t py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-4 sm:flex-row sm:justify-between">
        <span className="flex items-center gap-2 text-center sm:text-left">
          <CompassIcon aria-hidden className="size-4 shrink-0 text-primary" />
          {t("tagline")}
        </span>
        <nav aria-label={t("navLabel")} className="flex flex-wrap gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
};
