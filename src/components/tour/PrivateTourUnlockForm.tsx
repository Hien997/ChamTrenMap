"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { KeyRoundIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRIVATE_TOUR_CODE_LENGTH } from "@/config/constants";

/**
 * Unlock form: a code **and** a phone number.
 *
 * The server answers with one fixed message for every refusal (ADR-0006), so
 * this form has nothing to branch on but success or not — there is no "code not
 * found" versus "wrong phone" to echo back, by design.
 */
const PrivateTourUnlockForm = () => {
  const t = useTranslations("PrivateTour");
  const locale = useLocale();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const trimmedCode = code.trim().toUpperCase();

    startTransition(async () => {
      try {
        const res = await fetch(`/api/private-tours/access?locale=${locale}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: trimmedCode, phone: phone.trim() }),
        });
        const json: { ok: boolean; error?: { message?: string } } =
          await res.json();

        if (!json.ok) {
          setError(json.error?.message ?? t("accessDenied"));
          return;
        }
        router.push(`/${locale}/private-tour/${trimmedCode}`);
      } catch {
        setError(t("networkError"));
      }
    });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="private-tour-code">{t("codeLabel")}</Label>
        <Input
          id="private-tour-code"
          required
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="ABCD2345"
          maxLength={PRIVATE_TOUR_CODE_LENGTH}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="h-11 font-mono tracking-widest"
          aria-invalid={!!error}
        />
        <p className="text-xs text-muted-foreground">{t("codeHint")}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="private-tour-phone">{t("phoneLabel")}</Label>
        <Input
          id="private-tour-phone"
          required
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="0912 345 678"
          autoComplete="tel"
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">{t("phoneHint")}</p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        <KeyRoundIcon aria-hidden className="size-4" />
        {isPending ? t("unlocking") : t("unlock")}
      </Button>
    </form>
  );
};

export default PrivateTourUnlockForm;
