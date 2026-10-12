"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Error boundary for every public page (rendered inside `[locale]/layout.tsx`,
 * so the document shell survives a failed page).
 *
 * `reset` re-renders the segment, which is the right recovery for the failure
 * this app actually sees: a dropped DB query on a dynamic route. Deliberately
 * no console.error — Next already reports the error with its digest, and this
 * file is the only thing the visitor sees.
 */
export default function LocaleError({ error, reset }: Props) {
  const t = useTranslations("Common");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t("error")}</h1>
      <p className="max-w-md text-muted-foreground">{t("errorBody")}</p>
      {error.digest ? (
        <p className="text-xs tabular-nums text-muted-foreground/70">
          {error.digest}
        </p>
      ) : null}
      <div className="flex gap-3">
        <Button onClick={reset}>{t("retry")}</Button>
        <Link
          href="/"
          className="inline-flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
