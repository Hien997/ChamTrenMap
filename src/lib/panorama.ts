export const PANORAMA_ASPECT_RATIO = 2;

export const PANORAMA_ASPECT_TOLERANCE = 0.08;

export const PANORAMA_MIN_WIDTH = 1024;

export function isLikelyPanorama(width: number, height: number): boolean {
  if (!Number.isFinite(width) || !Number.isFinite(height)) return false;
  if (width < PANORAMA_MIN_WIDTH || height <= 0) return false;

  const aspect = width / height;
  return Math.abs(aspect - PANORAMA_ASPECT_RATIO) <= PANORAMA_ASPECT_TOLERANCE;
}
