import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import {
  VISITOR_COOKIE_MAX_AGE_SECONDS,
  VISITOR_COOKIE_NAME,
} from "@/config/constants";
import { prisma } from "@/lib/prisma";

/**
 * Visitor session seam (ADR-0001): anonymous, cookie-borne identity.
 *
 * The cookie only carries a key — no row is written until the visitor's
 * first check-in (`ensureVisitorWithCookie`, route-handler only because it
 * mutates cookies). Read paths (`getSessionVisitor`) never create rows.
 */

export function newVisitorKey(): string {
  return randomBytes(32).toString("hex");
}

export async function readVisitorId(): Promise<string | null> {
  const store = await cookies();
  return store.get(VISITOR_COOKIE_NAME)?.value ?? null;
}

export async function findVisitor(key: string | null): Promise<User | null> {
  if (!key) return null;
  return prisma.user.findUnique({ where: { visitorKey: key } });
}

/** Read-only session lookup for pages — never writes. */
export async function getSessionVisitor(): Promise<User | null> {
  return findVisitor(await readVisitorId());
}

/** Create-if-missing for a known key — the write half of write-lazy identity. */
export async function ensureVisitor(key: string): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { visitorKey: key } });
  if (existing) return existing;
  return prisma.user.create({ data: { visitorKey: key } });
}

/**
 * First-check-in glue for route handlers: reuse the cookie's key (or mint
 * one), ensure the row exists, and attach `ctm_visitor` when new.
 */
export async function ensureVisitorWithCookie(): Promise<User> {
  const store = await cookies();
  const cookieKey = store.get(VISITOR_COOKIE_NAME)?.value ?? null;
  if (cookieKey) {
    const existing = await prisma.user.findUnique({
      where: { visitorKey: cookieKey },
    });
    if (existing) return existing;
  }

  const key = cookieKey ?? newVisitorKey();
  const user = await ensureVisitor(key);
  store.set(VISITOR_COOKIE_NAME, key, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: VISITOR_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
  return user;
}
