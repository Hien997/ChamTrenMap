import { nanoid } from "nanoid";
import type { Locale } from "@/config/constants";
import { DEFAULT_LOCALE, SHARE_ID_LENGTH } from "@/config/constants";
import { prisma } from "@/lib/prisma";
import { pickLocalized } from "@/services/localize";
import type { SharePageView } from "@/types";

export type CreateShareLinkResult =
  | { status: "ok"; shareId: string; url: string }
  | { status: "not_found" }
  | { status: "forbidden" };

export async function createShareLink(
  userId: string,
  checkInId: string,
  origin: string,
): Promise<CreateShareLinkResult> {
  const checkIn = await prisma.checkIn.findUnique({
    where: { id: checkInId },
    include: { shareLink: true },
  });
  if (!checkIn) return { status: "not_found" };
  if (checkIn.userId !== userId) return { status: "forbidden" };

  const shareId = checkIn.shareLink?.id ?? nanoid(SHARE_ID_LENGTH);
  if (!checkIn.shareLink) {
    await prisma.shareLink.create({ data: { id: shareId, checkInId: checkIn.id } });
  }

  return {
    status: "ok",
    shareId,
    url: `${origin}/${DEFAULT_LOCALE}/share/checkin/${shareId}`,
  };
}

export async function getSharePageView(
  shareId: string,
  locale: Locale,
): Promise<SharePageView | null> {
  const shareLink = await prisma.shareLink.findUnique({
    where: { id: shareId },
    include: {
      checkIn: {
        include: {
          checkpoint: {
            include: {
              translations: true,
              images: { orderBy: { sortOrder: "asc" } },
              tourLinks: {
                include: { tour: { include: { translations: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!shareLink) return null;

  const checkpoint = shareLink.checkIn.checkpoint;
  const cpTranslation = pickLocalized(checkpoint.translations, locale);
  const tourLink = checkpoint.tourLinks[0];
  const tourTranslation = tourLink
    ? pickLocalized(tourLink.tour.translations, locale)
    : undefined;

  return {
    shareId: shareLink.id,
    checkedInAt: shareLink.checkIn.checkedInAt.toISOString(),
    checkpoint: {
      slug: checkpoint.slug,
      name: cpTranslation?.name ?? checkpoint.slug,
      address: cpTranslation?.address ?? "",
      thumbnailUrl:
        checkpoint.images.find((img) => img.isThumbnail)?.url ??
        checkpoint.images[0]?.url ??
        null,
    },
    tour: tourLink
      ? {
          slug: tourLink.tour.slug,
          name: tourTranslation?.name ?? tourLink.tour.slug,
        }
      : null,
  };
}
