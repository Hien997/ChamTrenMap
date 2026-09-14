/**
 * DEMO seed runner (Plan.md §11/§2). Idempotent: safe to run repeatedly.
 * Re-running refreshes the demo translations/guides/images but never touches
 * users, check-ins or progress.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

import {
  seedCheckpoints,
  seedTours,
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
      priceVnd: checkpoint.priceVnd,
      priceKind: checkpoint.priceKind === "food" ? "FOOD" : "TICKET",
    },
    update: {
      latitude: checkpoint.latitude,
      longitude: checkpoint.longitude,
      radiusMeters: checkpoint.radiusMeters,
      estimatedVisitMinutes: checkpoint.estimatedVisitMinutes,
      priceVnd: checkpoint.priceVnd,
      priceKind: checkpoint.priceKind === "food" ? "FOOD" : "TICKET",
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

  for (const seedTour of seedTours) {
    const tour = await prisma.tour.upsert({
      where: { slug: seedTour.slug },
      create: {
        slug: seedTour.slug,
        status: "PUBLISHED",
      },
      update: {
        status: "PUBLISHED",
      },
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
        return {
          tourId: tour.id,
          checkpointId: checkpoint.id,
          order: index + 1,
        };
      }),
    });
  }

  // Keep the Checkpoint table exactly in sync with seedCheckpoints: remove any
  // rows that are no longer part of the demo data set (e.g. removed checkpoints).
  // Tour links are re-created above, so stale checkpoints have no references.
  const seededSlugs = new Set(seedCheckpoints.map((cp) => cp.slug));
  const staleCheckpoints = await prisma.checkpoint.findMany({
    where: { NOT: { slug: { in: [...seededSlugs] } } },
    select: { id: true, slug: true },
  });
  for (const stale of staleCheckpoints) {
    await prisma.checkpoint.delete({ where: { id: stale.id } });
    console.log(`🗑️  Removed checkpoint no longer in seed data: ${stale.slug}`);
  }

  console.log(
    `✅ Seeded ${seedTours.length} tours with ${checkpoints.length} checkpoints (vi + en).`,
  );

  // Admin user (spec §Admin). Credentials come from env; only the bcrypt
  // hash is stored. If env vars are absent the seed skips this step.
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: "ADMIN", passwordHash },
      create: {
        email: adminEmail,
        role: "ADMIN",
        passwordHash,
        sessionToken: crypto.randomUUID(),
      },
    });
    console.log(`✅ Admin user ready: ${adminEmail}`);
  } else {
    console.log("⚠️  ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed.");
  }
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
