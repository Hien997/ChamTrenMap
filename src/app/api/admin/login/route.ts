import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, ADMIN_SESSION_MAX_AGE_SECONDS } from "@/config/constants";
import { adminError, adminOk, parseAdminBody } from "@/lib/api";
import { checkLoginRate, issueAdminSession, verifyPassword } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/admin";

export async function POST(request: NextRequest) {
  // S3: throttle before doing any parsing or DB work.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkLoginRate(ip);
  if (!limit.ok) {
    return adminError("Too many login attempts. Try again later.", 429, {
      init: { headers: { "Retry-After": String(limit.retryAfterSec) } },
    });
  }

  const parsed = parseAdminBody(loginSchema, await request.json());
  if (!parsed.ok) return parsed.response;

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user || !user.passwordHash) {
    return adminError("Invalid credentials", 401);
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return adminError("Invalid credentials", 401);
  }

  // S7: rotate the token on every login; cookie lifetime matches the DB expiry.
  const token = await issueAdminSession(user.id);
  const response = adminOk();
  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
