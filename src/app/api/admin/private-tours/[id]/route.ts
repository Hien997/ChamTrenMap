import type { NextRequest } from "next/server";
import { adminError, adminOk, parseAdminBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-auth";
import { updatePrivateTourSchema } from "@/lib/validations/admin";
import {
  deletePrivateTour,
  getPrivateTourForAdmin,
  updatePrivateTour,
} from "@/services/private-tours.service";

export const GET = async (request: NextRequest) => {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const { pathname } = new URL(request.url);
  const id = pathname.split("/").pop() ?? "";

  const tour = await getPrivateTourForAdmin(id);
  if (!tour) return adminError("Private tour not found", 404);

  return adminOk({
    tour: {
      id: tour.id,
      code: tour.code,
      status: tour.status,
      customerName: tour.customerName,
      customerPhone: tour.customerPhone,
      maxSlots: tour.maxSlots,
      startsAt: tour.startsAt,
      expiresAt: tour.expiresAt,
      createdAt: tour.createdAt,
      slotsUsed: tour._count.accesses,
      vi: tour.translations.find((t) => t.locale === "vi") ?? null,
      en: tour.translations.find((t) => t.locale === "en") ?? null,
      // Array order is the visit order (ADR-0004), which the drag-and-drop
      // editor round-trips verbatim.
      checkpointIds: tour.stops.map((stop) => stop.checkpointId),
    },
  });
};

export const PATCH = async (request: NextRequest) => {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const parsed = parseAdminBody(updatePrivateTourSchema, await request.json());
  if (!parsed.ok) return parsed.response;

  const { pathname } = new URL(request.url);
  const id = pathname.split("/").pop() ?? "";
  const existing = await prisma.privateTour.findUnique({ where: { id } });
  if (!existing) return adminError("Private tour not found", 404);

  const { checkpointIds, ...rest } = parsed.data;

  if (checkpointIds) {
    const found = await prisma.checkpoint.count({
      where: { id: { in: checkpointIds } },
    });
    if (found !== checkpointIds.length) {
      return adminError("Invalid input", 400, {
        details: [
          {
            path: "checkpointIds",
            message: "One or more of those checkpoints no longer exists.",
          },
        ],
      });
    }
  }

  await updatePrivateTour({ id, ...rest, checkpointIds });
  return adminOk();
};

export const DELETE = async (request: NextRequest) => {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const { pathname } = new URL(request.url);
  const id = pathname.split("/").pop() ?? "";

  const tour = await prisma.privateTour.findUnique({ where: { id } });
  if (!tour) return adminError("Private tour not found", 404);

  await deletePrivateTour(tour.id);
  return adminOk();
};
