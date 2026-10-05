import type { NextRequest } from "next/server";
import {
  adminError,
  adminOk,
  parseAdminBody,
  parseAdminListQuery,
} from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-auth";
import { createPrivateTourSchema } from "@/lib/validations/admin";
import {
  createPrivateTour,
  listPrivateTours,
} from "@/services/private-tours.service";

export const GET = async (request: NextRequest) => {
  const unauthorized = await requireAdminApi();
  if (unauthorized) {
    return unauthorized;
  }

  // `parseAdminListQuery` is the one place `?q=&take=&offset=` is coerced and
  // bounded (ADR-0003). Hand-clamping was wrong here: `Number("2.5")` is
  // finite, so `Math.min(Math.max(2.5, 1), 50)` stayed `2.5` and reached Prisma
  // as a `take`/`skip` that is not an `Int` — a 500 for a typo, where the
  // sibling list routes answer 400.
  const query = parseAdminListQuery(request.nextUrl.searchParams);
  if (!query.ok) {
    return query.response;
  }
  const { q, take, offset } = query.data;

  const { items, total } = await listPrivateTours({ q, take, offset });

  return adminOk({ items, total });
};

export const POST = async (request: NextRequest) => {
  const unauthorized = await requireAdminApi();
  if (unauthorized) {
    return unauthorized;
  }
  const parsed = parseAdminBody(createPrivateTourSchema, await request.json());
  if (!parsed.ok) {
    return parsed.response;
  }

  const { checkpointIds, ...rest } = parsed.data;

  // Reject unknown ids before writing, so a stale picker cannot create a tour
  // with dangling stops.
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

  const tour = await createPrivateTour({ ...rest, checkpointIds });
  return adminOk({ tour: { id: tour.id, code: tour.code } });
};
