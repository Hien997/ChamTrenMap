import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import type { User } from "@prisma/client";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  LOGIN_RATE_LIMIT,
} from "@/config/constants";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { rateLimit, type RateLimitResult } from "@/lib/rate-limit";

/**
 * Admin auth seam (ADR-0001): rotating, expiring, revocable sessions.
 * The token lives only in the `ctm_admin` cookie; the DB stores its SHA-256
 * plus an absolute expiry. Login is rate-limited (S3). Pages redirect
 * (`requireAdminPage`); route handlers get 401 JSON (`requireAdminApi`, S9).
 */

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function newAdminToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashAdminToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Rotate the admin token: fresh random value per login, old one revoked. */
export async function issueAdminSession(userId: string): Promise<string> {
  const token = newAdminToken();
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000);
  await prisma.user.update({
    where: { id: userId },
    data: {
      adminSessionTokenHash: hashAdminToken(token),
      adminSessionExpiresAt: expiresAt,
    },
  });
  return token;
}

export async function verifyAdminToken(
  token: string | null,
): Promise<User | null> {
  if (!token) return null;
  const user = await prisma.user.findUnique({
    where: { adminSessionTokenHash: hashAdminToken(token) },
  });
  if (!user) return null;
  if (
    !user.adminSessionExpiresAt ||
    user.adminSessionExpiresAt.getTime() <= Date.now()
  ) {
    return null;
  }
  return user;
}

async function readAdminToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE_NAME)?.value ?? null;
}

export async function getAdminUser(): Promise<User | null> {
  const user = await verifyAdminToken(await readAdminToken());
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

/** Page/layout guard: redirect to login (former `requireAdmin`). */
export async function requireAdminPage(): Promise<User> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** Route-handler guard: `null` when authenticated, else a 401 JSON response. */
export async function requireAdminApi(): Promise<NextResponse | null> {
  const user = await getAdminUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Admin session required", 401);
  }
  return null;
}

export async function revokeAdminSession(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { adminSessionTokenHash: null, adminSessionExpiresAt: null },
  });
}

/** S3: throttle login attempts per IP (trusted-proxy `x-forwarded-for`). */
export function checkLoginRate(ip: string): RateLimitResult {
  return rateLimit(`login:${ip}`, LOGIN_RATE_LIMIT);
}
