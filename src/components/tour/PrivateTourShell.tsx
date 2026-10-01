"use client";

import { type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { LockKeyholeIcon } from "lucide-react";

import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";

/**
 * The visual frame shared by both private-tour routes: the `.private-tour-skin`
 * backdrop (see `globals.css`) plus a header that carries the two things those
 * routes otherwise lack — a marker that this page is private, and the language
 * switcher.
 *
 * The public pages get both from `SiteHeader`; the private routes deliberately
 * do not render it, because it links to `/` and `/tours`, which would tell a
 * holder of a private code that the public catalogue exists. So the switcher is
 * mounted here instead — switching locale round-trips the same path, code
 * included, via `@/i18n/navigation`.
 */
const PrivateTourShell = ({ children }: { children: ReactNode }) => {
  const t = useTranslations("PrivateTour");

  return (
    <div className="private-tour-skin relative flex min-h-dvh w-full flex-col">
      <header className="relative z-10 mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <span className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-medium tracking-[0.18em] text-primary uppercase">
          <LockKeyholeIcon aria-hidden className="size-3.5 shrink-0" />
          {t("privateBadge")}
        </span>
        <LocaleSwitcher />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-14 sm:px-6">
        {children}
      </main>
    </div>
  );
};

export default PrivateTourShell;
