import type { MetadataRoute } from "next";
import { SUPPORTED_LOCALES } from "@/config/constants";
import { listCheckpoints } from "@/services/checkpoints.service";
import { listTours } from "@/services/tours.service";

export const dynamic = "force-dynamic"; // DB-driven at request time

/** SEO sitemap (spec §31): all locale variants of every tour & checkpoint. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
    .replace(/\/$/, "");

  const entries: MetadataRoute.Sitemap = [];
  for (const locale of SUPPORTED_LOCALES) {
    entries.push({
      url: `${base}/${locale}`,
      changeFrequency: "weekly",
      priority: 1,
    });
    entries.push({
      url: `${base}/${locale}/tours`,
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  try {
    const tours = await listTours("vi");
    for (const tour of tours) {
      for (const locale of SUPPORTED_LOCALES) {
        entries.push({
          url: `${base}/${locale}/tours/${tour.slug}`,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }

    const checkpoints = await listCheckpoints("vi");
    for (const checkpoint of checkpoints) {
      for (const locale of SUPPORTED_LOCALES) {
        entries.push({
          url: `${base}/${locale}/checkpoints/${checkpoint.slug}`,
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }
    }
  } catch {
    // Database unreachable (e.g. build without DB) — ship the static entries.
  }

  return entries;
}
