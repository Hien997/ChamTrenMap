/**
 * DEMO seed runner (Plan.md §11/§2). Idempotent: safe to run repeatedly.
 * Re-running refreshes the demo translations/guides/images but never touches
 * users, check-ins or progress.
 */
import { PrismaClient } from "@prisma/client";

import {
  seedCheckpoints,
  seedTour,
  type SeedCheckpoint,
  type SeedLocale,
} from "./seed-data";

const prisma = new PrismaClient();

async function seedCheckpoint(checkpoint: SeedCheckpoint) {
  const created = await prisma.checkpoint.upsert({
    where: { slug: checkpoint.slug },
    create: {
      slug: checkpoint.slug,
      latitude: checkpoint.latitude,
      longitude: checkpoint.longitude,
      radiusMeters: checkpoint.radiusMeters,
      estimatedVisitMinutes: checkpoint.estimatedVisitMinutes,
    },
    update: {
      latitude: checkpoint.latitude,
      longitude: checkpoint.longitude,
      radiusMeters: checkpoint.radiusMeters,
      estimatedVisitMinutes: checkpoint.estimatedVisitMinutes,
    },
  });

  // The demo seed owns localized content for these checkpoints.
  await prisma.checkpointTranslation.deleteMany({
    where: { checkpointId: created.id },
  });
  await prisma.guideSection.deleteMany({ where: { checkpointId: created.id } });
  await prisma.checkpointImage.deleteMany({
    where: { checkpointId: created.id },
  });

  await prisma.checkpointTranslation.createMany({
    data: (Object.keys(checkpoint.translations) as SeedLocale[]).map(
      (locale) => ({
        checkpointId: created.id,
        locale,
        ...checkpoint.translations[locale],
      }),
    ),
  });

  await prisma.guideSection.createMany({
    data: checkpoint.guides.flatMap((section, index) =>
      (Object.keys(section.content) as SeedLocale[]).map((locale) => ({
        checkpointId: created.id,
        locale,
        sectionKey: section.sectionKey,
        title: section.title[locale],
        content: section.content[locale],
        sortOrder: index,
      })),
    ),
  });

  await prisma.checkpointImage.createMany({
    data: checkpoint.images.map((image, index) => ({
      checkpointId: created.id,
      url: image.url,
      alt: image.alt,
      sortOrder: index,
      isThumbnail: index === 0,
    })),
  });

  return created;
}

async function main() {
  console.log("🌱 Seeding DEMO data for Hà Tiên Discovery…");

  const checkpoints: Awaited<ReturnType<typeof seedCheckpoint>>[] = [];
  for (const data of seedCheckpoints) {
    checkpoints.push(await seedCheckpoint(data));
  }

  const tour = await prisma.tour.upsert({
    where: { slug: seedTour.slug },
    create: { slug: seedTour.slug, status: "PUBLISHED" },
    update: { status: "PUBLISHED" },
  });

  await prisma.tourTranslation.deleteMany({ where: { tourId: tour.id } });
  await prisma.tourTranslation.createMany({
    data: (Object.keys(seedTour.translations) as SeedLocale[]).map(
      (locale) => ({
        tourId: tour.id,
        locale,
        ...seedTour.translations[locale],
      }),
    ),
  });

  await prisma.tourCheckpoint.deleteMany({ where: { tourId: tour.id } });
  await prisma.tourCheckpoint.createMany({
    data: seedTour.checkpointSlugs.map((slug, index) => {
      const checkpoint = checkpoints.find((cp) => cp.slug === slug);
      if (!checkpoint) throw new Error(`Seed checkpoint missing: ${slug}`);
      return { tourId: tour.id, checkpointId: checkpoint.id, order: index + 1 };
    }),
  });

  console.log(
    `✅ Seeded tour "${seedTour.slug}" with ${checkpoints.length} checkpoints (vi + en).`,
  );
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
