import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/config/constants";
import { prisma } from "@/lib/prisma";

export async function getOrCreateSessionUser(): Promise<User> {
  const store = await cookies();
  const existingToken = store.get(SESSION_COOKIE_NAME)?.value;

  if (existingToken) {
    const existing = await prisma.user.findUnique({
      where: { sessionToken: existingToken },
    });
    if (existing) return existing;
  }

  const sessionToken = randomBytes(32).toString("hex");
  const user = await prisma.user.create({ data: { sessionToken } });

  store.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  return user;
}

export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return prisma.user.findUnique({ where: { sessionToken: token } });
}
