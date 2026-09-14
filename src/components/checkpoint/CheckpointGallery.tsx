"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";

type GalleryImage = { url: string; alt: string | null };

type Props = {
  images: GalleryImage[];
  /** Fallback alt text when an image has none. */
  name: string;
};

/**
 * Editorial composition for the photo gallery.
 *
 * Desktop (sm+): 12-col grid — the lead photo spans 8 columns across two
 * rows while supporting photos fill a 4-column rail at a consistent 4:3;
 * extras flow below as thirds, halves, or one full-width panorama.
 * Mobile: full-width lead over a balanced 2-column row.
 */
function cellClass(index: number, count: number): string {
  if (count === 1) return "col-span-2 aspect-[16/9] sm:col-span-12";
  if (index === 0) {
    // Two images: asymmetric 7/5 pair with matched heights (7:5 vs square).
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

  // Unmount after the exit animation finishes, then hand focus back.
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => {
      setIndex(null);
      setClosing(false);
      triggerRefs.current[lastIndexRef.current]?.focus();
    }, 200);
    return () => clearTimeout(timer);
  }, [closing]);

  // Keyboard: Escape closes, arrows navigate (with wrap-around).
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

  // Lock page scroll while open; compensate for the scrollbar so the
  // layout behind the lightbox never shifts.
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

  // Move focus into the dialog once it opens.
  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  if (count === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-12">
        {images.map((image, i) => (
          <button
            key={image.url}
            ref={(el) => {
              triggerRefs.current[i] = el;
            }}
            type="button"
            aria-haspopup="dialog"
            aria-label={t("openImage")}
            onClick={() => openAt(i)}
            className={`group relative overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${cellClass(i, count)}`}
          >
            <img
              src={image.url}
              alt={image.alt ?? name}
              loading={i === 0 ? "eager" : "lazy"}
              draggable={false}
              className="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          </button>
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
              <img
                key={images[current].url}
                src={images[current].url}
                alt={images[current].alt ?? name}
                draggable={false}
                className="pointer-events-auto max-h-[78vh] max-w-[92vw] rounded-md object-contain shadow-2xl animate-in fade-in duration-300 motion-reduce:animate-none sm:max-w-[min(72rem,86vw)]"
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