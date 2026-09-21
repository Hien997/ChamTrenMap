"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";


import { probePanoramaImage } from "./PanoramaProbe";
import type {
  PanoramaImageSource,
  PanoramaStatus,
  PanoramaViewerProps,
} from "./types";
import { prefersReducedMotion } from "@/lib/reduced-motion";

const PanoramaCanvas = dynamic(
  () => import("./PanoramaCanvas").then((m) => m.PanoramaCanvas),
  { ssr: false },
);

export function usePanoramaStatus(src: string): PanoramaStatus {
  const [status, setStatus] = useState<PanoramaStatus>("probing");

  useEffect(() => {
    let cancelled = false;
    setStatus("probing");
    probePanoramaImage(src).then((probe) => {
      if (!cancelled) setStatus(probe.status);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  return status;
}

function FlatPhoto({
  src,
  alt,
  className,
  fit = "cover",
}: PanoramaImageSource & { className?: string; fit?: "cover" | "contain" }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      draggable={false}
      className={
        className ?? `h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"}`
      }
    />
  );
}

export function PanoramaViewer({
  src,
  alt,
  initialYaw = 0,
  autoRotate = true,
  className,
  fit = "cover",
  onReady,
}: PanoramaViewerProps) {
  const tCommon = useTranslations("Common");
  const status = usePanoramaStatus(src);
  const shouldRotate = useMemo(
    () => autoRotate && !prefersReducedMotion(),
    [autoRotate],
  );

  if (status === "flat")
    return <FlatPhoto src={src} alt={alt} className={className} fit={fit} />;

  const loadingLabel = tCommon("loading");

  return (
    <div className={className} role="img" aria-label={alt}>
      {status === "probing" ? (
        <div aria-hidden="true" className="h-full w-full bg-muted">
          {/* Pure-CSS pulse: keeps this module free of UI-kit deps. */}
          <div className="h-full w-full animate-pulse bg-muted" role="status">
            <span className="sr-only">{loadingLabel}</span>
          </div>
        </div>
      ) : (
        <PanoramaCanvas
          src={src}
          alt={alt}
          autoRotate={shouldRotate}
          initialYaw={initialYaw}
          onReady={onReady}
        />
      )}
    </div>
  );
}
