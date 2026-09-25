import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@prisma/client";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  LOGIN_RATE_LIMIT,
} from "@/config/constants";
import {
  checkLoginRate,
  getAdminUser,
  hashAdminToken,
  hashPassword,
  issueAdminSession,
  newAdminToken,
  requireAdminApi,
  requireAdminPage,
  revokeAdminSession,
  verifyAdminToken,
  verifyPassword,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { resetRateLimiter } from "@/lib/rate-limit";

const cookieState = vi.hoisted(() => ({
  values: new Map<string, string>(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieState.values.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: () => {},
  }),
}));

const navState = vi.hoisted(() => ({ redirect: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    navState.redirect(url);
    throw new Error("NEXT_REDIRECT");
  },
}));

function makeUser(overrides: Partial<User> = {}) {
  return {
    id: "admin-1",
    visitorKey: null,
    role: "ADMIN" as const,
    email: "admin@example.com",
    passwordHash: null,
    adminSessionTokenHash: null,
    adminSessionExpiresAt: null,
    createdAt: new Date("2026-09-23T00:00:00Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  navState.redirect.mockClear();
  cookieState.values.clear();
});

describe("admin tokens", () => {
  it("hashAdminToken is deterministic SHA-256 and never the raw token", () => {
    const token = newAdminToken();
    expect(token).toHaveLength(64);
    const hash = hashAdminToken(token);
    expect(hash).toHaveLength(64);
    expect(hash).toBe(hashAdminToken(token));
    expect(hash).not.toBe(token);
  });

  it("issueAdminSession stores the hash (not the token) with an absolute expiry", async () => {
    const update = vi
      .spyOn(prisma.user, "update")
      .mockResolvedValue(makeUser());
    const before = Date.now();
    const token = await issueAdminSession("admin-1");
    expect(update).toHaveBeenCalledTimes(1);
    const args = update.mock.calls[0][0] as {
      where: { id: string };
      data: { adminSessionTokenHash: string; adminSessionExpiresAt: Date };
    };
    expect(args.where).toEqual({ id: "admin-1" });
    expect(args.data.adminSessionTokenHash).toBe(hashAdminToken(token));
    expect(args.data.adminSessionTokenHash).not.toBe(token);
    const expected = before + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
    expect(
      Math.abs(args.data.adminSessionExpiresAt.getTime() - expected),
    ).toBeLessThan(5_000);
  });
});

describe("verifyAdminToken / getAdminUser", () => {
  it("verifyAdminToken(null) is null without touching prisma", async () => {
    const findUnique = vi.spyOn(prisma.user, "findUnique");
    await expect(verifyAdminToken(null)).resolves.toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("looks up by SHA-256 hash, never the raw token", async () => {
    const token = newAdminToken();
    const findUnique = vi
      .spyOn(prisma.user, "findUnique")
      .mockResolvedValue(
        makeUser({ adminSessionExpiresAt: new Date(Date.now() + 60_000) }),
      );
    await expect(verifyAdminToken(token)).resolves.not.toBeNull();
    expect(findUnique).toHaveBeenCalledWith({
      where: { adminSessionTokenHash: hashAdminToken(token) },
    });
  });

  it("rejects unknown and expired tokens", async () => {
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);
    await expect(verifyAdminToken("nope")).resolves.toBeNull();

    vi.spyOn(prisma.user, "findUnique").mockResolvedValue(
      makeUser({ adminSessionExpiresAt: new Date(Date.now() - 1_000) }),
    );
    await expect(verifyAdminToken("expired")).resolves.toBeNull();

    vi.spyOn(prisma.user, "findUnique").mockResolvedValue(
      makeUser({ adminSessionExpiresAt: new Date(Date.now() + 60_000) }),
    );
    await expect(verifyAdminToken("valid")).resolves.not.toBeNull();
  });

  it("getAdminUser: no cookie → null; non-admin role → null; admin → user", async () => {
    const findUnique = vi.spyOn(prisma.user, "findUnique");
    await expect(getAdminUser()).resolves.toBeNull();
    expect(findUnique).not.toHaveBeenCalled();

    cookieState.values.set(ADMIN_COOKIE_NAME, "tok");
    findUnique.mockResolvedValue(
      makeUser({
        role: "ANONYMOUS",
        adminSessionExpiresAt: new Date(Date.now() + 60_000),
      }),
    );
    await expect(getAdminUser()).resolves.toBeNull();

    findUnique.mockResolvedValue(
      makeUser({ adminSessionExpiresAt: new Date(Date.now() + 60_000) }),
    );
    await expect(getAdminUser()).resolves.toMatchObject({ role: "ADMIN" });
  });
});

describe("guards", () => {
  it("requireAdminPage redirects unauthenticated visitors to /admin/login", async () => {
    await expect(requireAdminPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(navState.redirect).toHaveBeenCalledWith("/admin/login");
  });

  it("requireAdminApi returns a 401 JSON envelope when unauthenticated (S9)", async () => {
    const res = await requireAdminApi();
    if (!res) throw new Error("expected a 401 response");
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toMatchObject({
      ok: false,
      error: { code: "UNAUTHORIZED" },
    });
  });

  it("requireAdminApi returns null (pass) for a valid admin session", async () => {
    cookieState.values.set(ADMIN_COOKIE_NAME, "tok");
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue(
      makeUser({ adminSessionExpiresAt: new Date(Date.now() + 60_000) }),
    );
    await expect(requireAdminApi()).resolves.toBeNull();
  });

  it("revokeAdminSession clears hash and expiry server-side", async () => {
    const update = vi
      .spyOn(prisma.user, "update")
      .mockResolvedValue(makeUser());
    await revokeAdminSession("admin-1");
    expect(update).toHaveBeenCalledWith({
      where: { id: "admin-1" },
      data: { adminSessionTokenHash: null, adminSessionExpiresAt: null },
    });
  });
});

describe("checkLoginRate (S3)", () => {
  beforeEach(() => resetRateLimiter());
  afterEach(() => {
    vi.useRealTimers();
    resetRateLimiter();
  });

  it("allows LOGIN_RATE_LIMIT.max attempts per IP, blocks the next one", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-23T10:00:00Z"));
    for (let i = 0; i < LOGIN_RATE_LIMIT.max; i++) {
      expect(checkLoginRate("1.2.3.4").ok).toBe(true);
    }
    const blocked = checkLoginRate("1.2.3.4");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThanOrEqual(1);
    // A different IP is unaffected.
    expect(checkLoginRate("5.6.7.8").ok).toBe(true);
  });

  it("lets the same IP through again once the window passes", () => {
    vi.useFakeTimers();
    const start = new Date("2026-09-23T10:00:00Z");
    vi.setSystemTime(start);
    for (let i = 0; i < LOGIN_RATE_LIMIT.max; i++) checkLoginRate("9.9.9.9");
    expect(checkLoginRate("9.9.9.9").ok).toBe(false);
    vi.setSystemTime(
      new Date(start.getTime() + LOGIN_RATE_LIMIT.windowMs + 1_000),
    );
    expect(checkLoginRate("9.9.9.9").ok).toBe(true);
  });
});

describe("password helpers (folded in from admin.ts)", () => {
  it("hashPassword/verifyPassword round-trip", async () => {
    const hash = await hashPassword("correct-horse-battery");
    await expect(verifyPassword("correct-horse-battery", hash)).resolves.toBe(
      true,
    );
    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });
});
