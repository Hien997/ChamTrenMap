import type { MetadataRoute } from "next";

/**
 * Installable PWA manifest (item P1-1 of the UI review).
 *
 * Icons are the existing favicon upscaled by `sips` to the two sizes the
 * install prompt asks for; `/manifest.webmanifest` is emitted here rather than
 * as a static file so the name stays in sync with `NEXT_PUBLIC_APP_URL` usage
 * elsewhere. `display: standalone` + `theme_color` give the app its own window
 * on a phone, which is the point — this is a site people open while standing
 * in front of a checkpoint, not a bookmark.
 */
const manifest = (): MetadataRoute.Manifest => {
  return {
    name: "Chắm Trên Map",
    short_name: "Chắm Trên Map",
    description:
      "Bản đồ check-in bản địa tại Hà Tiên, An Giang · Local check-in map for Ha Tien, An Giang",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#171717",
    lang: "vi",
    categories: ["travel", "navigation", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
};

export default manifest;
