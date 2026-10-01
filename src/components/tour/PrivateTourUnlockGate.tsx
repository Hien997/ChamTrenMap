"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarClockIcon, KeyRoundIcon } from "lucide-react";

import { PanoramaViewer } from "@/components/three/PanoramaViewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PrivateTourExperience from "@/components/tour/PrivateTourExperience";
import { PRIVATE_TOUR_CODE_LENGTH } from "@/config/constants";
import type { PrivateTourDetailView } from "@/types";

/** The two wire shapes `POST /api/private-tours/access` can answer with. */
type UnlockResponse =
  | { ok: true; data: { tour: PrivateTourDetailView; slotsUsed: number } }
  | { ok: false; error: { code?: string; message?: string } };

type Props = {
  /** Prefilled from the URL, so pasting an invitation link skips a field. */
  code?: string;
};

/**
 * The single decision point for a private-tour URL (ADR-0006).
 *
 * Both `/private-tour` and `/private-tour/[code]` render this and nothing else,
 * and this component has **no cookie read**: the itinerary is only ever the
 * body of a successful `POST /api/private-tours/access`, i.e. the response to a
 * request that carried the code *and* the phone number.
 *
 * That is a deliberate change of shape. The route used to render the itinerary
 * server-side, keyed off the holder cookie the unlock route sets — which meant
 * entering the two gates once on a device granted every later visit to the
 * link, refresh included, with no way to ask again. Requiring the gates on each
 * entry costs nothing in return: `unlockPrivateTour` upserts the slot, so a
 * holder who re-enters their code is not charged a second one, and it already
 * re-marks this session's arrivals so the itinerary comes back with them intact.
 *
 * Keeping the render here rather than on the server is what makes "refresh =
 * ask again" true — a server component cannot tell a fresh unlock from an old
 * cookie, because both arrive as the same request headers.
 */
const PrivateTourUnlockGate = ({ code: routeCode }: Props) => {
  const t = useTranslations("PrivateTour");
  const locale = useLocale();

  const [code, setCode] = useState((routeCode ?? "").trim().toUpperCase());
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [tour, setTour] = useState<PrivateTourDetailView | null>(null);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const submittedCode = code.trim().toUpperCase();

    startTransition(async () => {
      try {
        const res = await fetch(`/api/private-tours/access?locale=${locale}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: submittedCode, phone: phone.trim() }),
        });
        const json: UnlockResponse = await res.json();

        if (!json.ok) {
          // One fixed refusal for every gate, by design: a "wrong phone" that
          // differed from "no such code" would confirm codes to an attacker.
          setError(json.error?.message ?? t("accessDenied"));
          return;
        }

        setTour(json.data.tour);
      } catch {
        setError(t("networkError"));
      }
    });
  };

  // The sole place an itinerary is rendered, and it can only be reached with
  // `json.data.tour` in hand — which only a POST that matched the code against
  // the phone number ever produces.
  if (tour) {
    return (
      <>
        {tour.coverImageUrl && (
          <div className="relative -mx-4 aspect-[16/7] overflow-hidden rounded-2xl bg-muted/20 sm:-mx-6">
            <PanoramaViewer
              src={tour.coverImageUrl}
              alt={tour.name}
              className="absolute inset-0 h-full w-full"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
            />
          </div>
        )}

        <header className="space-y-3 border-b border-border/70 pt-6 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight">{tour.name}</h1>
          {tour.tagline && (
            <p className="text-sm text-muted-foreground">{tour.tagline}</p>
          )}
          {tour.description && (
            <p className="text-sm leading-relaxed text-foreground/90">
              {tour.description}
            </p>
          )}
          {tour.startsAt && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClockIcon aria-hidden className="size-4" />
              {t("startsAt")}:{" "}
              {new Date(tour.startsAt).toLocaleString(locale, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
          <p className="font-mono text-xs tracking-widest text-muted-foreground">
            {tour.code}
          </p>
        </header>

        <section className="pt-6">
          {tour.stops.length === 0 ? (
            <>
              <h2 className="mb-4 text-lg font-semibold">{t("itinerary")}</h2>
              <p className="text-sm text-muted-foreground">{t("noStops")}</p>
            </>
          ) : (
            <PrivateTourExperience tour={tour} />
          )}
        </section>
      </>
    );
  }

  return (
    <div className="my-auto w-full max-w-md space-y-6 py-8">
      <header className="space-y-2 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <KeyRoundIcon aria-hidden className="size-6" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

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
            aria-invalid={!!error}
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
    </div>
  );
};

export default PrivateTourUnlockGate;
