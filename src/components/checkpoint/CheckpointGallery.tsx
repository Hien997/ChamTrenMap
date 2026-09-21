"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Rotate3DIcon,
  XIcon,
} from "lucide-react";

import {
  PanoramaViewer,
  usePanoramaStatus,
} from "@/components/three/PanoramaViewer";

type GalleryImage = { url: string; alt: string | null };

type Props = {
  images: GalleryImage[];
  name: string;
};

function cellClass(index: number, count: number): string {
  if (count === 1) return "col-span-2 aspect-[16/9] sm:col-span-12";
  if (index === 0) {
    if (count === 2)
      return "col-span-1 aspect-[4/3] sm:col-span-7 sm:aspect-[7/5]";
    return "col-span-2 aspect-[16/10] sm:col-span-8 sm:row-span-2 sm:aspect-auto";
  }
  if (count === 2)
    return "col-span-1 aspect-[4/3] sm:col-span-5 sm:aspect-square";
  if (index < 3) return "col-span-1 aspect-[4/3] sm:col-span-4";
  const extras = count - 3;
  if (extras === 1)
    return "col-span-1 aspect-[4/3] sm:col-span-12 sm:aspect-[21/9]";
  if (extras === 2) return "col-span-1 aspect-[4/3] sm:col-span-6";
  return "col-span-1 aspect-[4/3] sm:col-span-4";
}

function GalleryCell({
  image,
  fallbackAlt,
  eager,
  onOpen,
  buttonRef,
  cellClassName,
}: {
  image: GalleryImage;
  fallbackAlt: string;
  eager: boolean;
  onOpen: () => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
  cellClassName: string;
}) {
  const t = useTranslations("Checkpoint");
  const status = usePanoramaStatus(image.url);
  const alt = image.alt ?? fallbackAlt;

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-haspopup="dialog"
      aria-label={t("openImage")}
      onClick={onOpen}
      className={`group relative overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${cellClassName}`}
    >
      <img
        src={image.url}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        draggable={false}
        className="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      {status === "panorama" && (
        <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          <Rotate3DIcon aria-hidden className="size-3.5" />
          360°
        </span>
      )}
    </button>
  );
}

function LightboxBody({
  image,
  fallbackAlt,
}: {
  image: GalleryImage;
  fallbackAlt: string;
}) {
  const t = useTranslations("Checkpoint");
  const status = usePanoramaStatus(image.url);
  const alt = image.alt ?? fallbackAlt;

  if (status === "flat") {
    return (
      <img
        src={image.url}
        alt={alt}
        draggable={false}
        className="pointer-events-auto max-h-[78vh] max-w-[92vw] rounded-md object-contain shadow-2xl animate-in fade-in duration-300 motion-reduce:animate-none sm:max-w-[min(72rem,86vw)]"
      />
    );
  }

  if (status === "probing") {
    return (
      <div
        role="status"
        aria-label={t("gallery")}
        className="pointer-events-auto h-[60vh] w-[86vw] animate-pulse rounded-md bg-white/10 sm:w-[min(72rem,86vw)]"
      />
    );
  }

  return (
    <div className="pointer-events-auto relative h-[78vh] w-[92vw] overflow-hidden rounded-md shadow-2xl sm:w-[min(72rem,86vw)]">
      <PanoramaViewer
        src={image.url}
        alt={alt}
        fit="contain"
        className="h-full w-full [&_canvas]:rounded-md"
      />
      <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium whitespace-nowrap text-white backdrop-blur-sm">
        {t("panoramaHint")}
      </p>
    </div>
  );
}

const navButton =
  "pointer-events-auto inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-200 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80";

export function CheckpointGallery({ images, name }: Props) {
  const t = useTranslations("Checkpoint");
  const count = images.length;

  const [index, setIndex] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const lastIndexRef = useRef(0);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const open = index !== null;
  const current = index ?? 0;

  const requestClose = useCallback(() => {
    if (index === null) return;
    setClosing(true);
  }, [index]);

  const openAt = (i: number) => {
    lastIndexRef.current = i;
    setClosing(false);
    setIndex(i);
  };

  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => {
      setIndex(null);
      setClosing(false);
      triggerRefs.current[lastIndexRef.current]?.focus();
    }, 200);
    return () => clearTimeout(timer);
  }, [closing]);

  useEffect(() => {
    if (!open || closing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose();
      } else if (event.key === "ArrowRight") {
        setIndex((i) => (i === null ? i : (i + 1) % count));
      } else if (event.key === "ArrowLeft") {
        setIndex((i) => (i === null ? i : (i - 1 + count) % count));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closing, count, requestClose]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) {
      document.body.style.paddingRight = `${scrollbar}px`;
    }
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
    };
  }, [open]);

  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  if (count === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-12">
        {images.map((image, i) => (
          <GalleryCell
            key={image.url}
            image={image}
            fallbackAlt={name}
            eager={i === 0}
            onOpen={() => openAt(i)}
            buttonRef={(el) => {
              triggerRefs.current[i] = el;
            }}
            cellClassName={cellClass(i, count)}
          />
        ))}
      </div>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("gallery")}
            className="fixed inset-0 z-50"
          >
            {/* Backdrop — Gulf night navy; click to close. */}
            <div
              aria-hidden="true"
              onClick={requestClose}
              className={`absolute inset-0 bg-[oklch(0.14_0.025_232/0.94)] backdrop-blur-[2px] ${
                closing
                  ? "animate-out fade-out duration-200"
                  : "animate-in fade-in duration-300"
              }`}
            />

            <div
              className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 sm:p-10 ${
                closing
                  ? "animate-out fade-out zoom-out-95 duration-200"
                  : "animate-in fade-in zoom-in-95 duration-300"
              }`}
            >
              <LightboxBody
                key={images[current].url}
                image={images[current]}
                fallbackAlt={name}
              />

              {count > 1 && (
                <p className="pointer-events-auto text-sm tabular-nums text-white/70">
                  {current + 1} / {count}
                </p>
              )}
            </div>

            {count > 1 && (
              <>
                <button
                  type="button"
                  aria-label={t("prevImage")}
                  onClick={() =>
                    setIndex((i) =>
                      i === null ? i : (i - 1 + count) % count,
                    )
                  }
                  className={`${navButton} absolute left-3 top-1/2 -translate-y-1/2 sm:left-6`}
                >
                  <ChevronLeftIcon aria-hidden className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label={t("nextImage")}
                  onClick={() =>
                    setIndex((i) => (i === null ? i : (i + 1) % count))
                  }
                  className={`${navButton} absolute right-3 top-1/2 -translate-y-1/2 sm:right-6`}
                >
                  <ChevronRightIcon aria-hidden className="size-5" />
                </button>
              </>
            )}

            <button
              ref={closeBtnRef}
              type="button"
              aria-label={t("close")}
              onClick={requestClose}
              className={`${navButton} absolute right-3 top-3 sm:right-6 sm:top-6`}
            >
              <XIcon aria-hidden className="size-5" />
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
