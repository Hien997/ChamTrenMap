import type { PanoramaStatus } from "./types";
import { isLikelyPanorama } from "@/lib/panorama";


export type PanoramaProbe = {
  ok: boolean;
  width: number;
  height: number;
  status: PanoramaStatus;
};

const UNPROBED: PanoramaProbe = {
  ok: false,
  width: 0,
  height: 0,
  status: "probing",
};

const FLAT: PanoramaProbe = { ok: false, width: 0, height: 0, status: "flat" };

const PROBE_CACHE_MAX = 100;
const probeCache = new Map<string, Promise<PanoramaProbe>>();

export function probePanoramaImage(src: string): Promise<PanoramaProbe> {
  if (typeof window === "undefined") return Promise.resolve(UNPROBED);

  const cached = probeCache.get(src);
  if (cached) return cached;

  const probe = new Promise<PanoramaProbe>((resolve) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      const ok = isLikelyPanorama(image.naturalWidth, image.naturalHeight);
      resolve({
        ok,
        width: image.naturalWidth,
        height: image.naturalHeight,
        status: ok ? "panorama" : "flat",
      });
    };

    image.onerror = () => resolve(FLAT);

    image.src = src;
  });

  probeCache.set(src, probe);
  if (probeCache.size > PROBE_CACHE_MAX) {
    const oldest = probeCache.keys().next();
    if (!oldest.done) probeCache.delete(oldest.value);
  }

  return probe;
}
