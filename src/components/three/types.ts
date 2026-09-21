export type PanoramaImageSource = {
  src: string;
  alt: string;
};

export type PanoramaViewerProps = PanoramaImageSource & {
  initialYaw?: number;
  autoRotate?: boolean;
  className?: string;
  fit?: "cover" | "contain";
  onReady?: () => void;
};

export type PanoramaCanvasProps = PanoramaImageSource & {
  autoRotate: boolean;
  initialYaw: number;
  onReady?: () => void;
};

export type PanoramaStatus = "probing" | "panorama" | "flat";
