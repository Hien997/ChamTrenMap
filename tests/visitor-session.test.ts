import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@prisma/client";
import {
  VISITOR_COOKIE_MAX_AGE_SECONDS,
  VISITOR_COOKIE_NAME,
} from "@/config/constants";
import { prisma } from "@/lib/prisma";
import {
  ensureVisitor,
  ensureVisitorWithCookie,
  findVisitor,
  getSessionVisitor,
  readVisitorId,
} from "@/lib/visitor-session";

const cookieState = vi.hoisted(() => ({
  values: new Map<string, string>(),
  setCalls: [] as Array<{ name: string; value: string; opts: unknown }>,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieState.values.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string, opts: unknown) => {
      cookieState.setCalls.push({ name, value, opts });
      cookieState.values.set(name, value);
    },
  }),
}));

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    visitorKey: "key-1",
    role: "ANONYMOUS",
    email: null,
    passwordHash: null,
    adminSessionTokenHash: null,
    adminSessionExpiresAt: null,
    createdAt: new Date("2026-09-23T00:00:00Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  cookieState.values.clear();
  cookieState.setCalls.length = 0;
});

describe("visitor-session", () => {
  it("readVisitorId returns the ctm_visitor cookie value", async () => {
    cookieState.values.set(VISITOR_COOKIE_NAME, "abc123");
    await expect(readVisitorId()).resolves.toBe("abc123");
  });

  it("readVisitorId returns null when the cookie is absent", async () => {
    await expect(readVisitorId()).resolves.toBeNull();
  });

  it("findVisitor(null) returns null without touching prisma", async () => {
    const findUnique = vi.spyOn(prisma.user, "findUnique");
    await expect(findVisitor(null)).resolves.toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("findVisitor(key) looks up by visitorKey only", async () => {
    const user = makeUser();
    const findUnique = vi
      .spyOn(prisma.user, "findUnique")
      .mockResolvedValue(user);
    await expect(findVisitor("key-1")).resolves.toEqual(user);
    expect(findUnique).toHaveBeenCalledWith({ where: { visitorKey: "key-1" } });
  });

  it("getSessionVisitor returns null when no cookie exists", async () => {
    const findUnique = vi.spyOn(prisma.user, "findUnique");
    await expect(getSessionVisitor()).resolves.toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("ensureVisitor reuses an existing row (write-lazy half)", async () => {
    const user = makeUser();
    const findUnique = vi
      .spyOn(prisma.user, "findUnique")
      .mockResolvedValue(user);
    const create = vi.spyOn(prisma.user, "create");
    await expect(ensureVisitor("key-1")).resolves.toEqual(user);
    expect(findUnique).toHaveBeenCalledWith({ where: { visitorKey: "key-1" } });
    expect(create).not.toHaveBeenCalled();
  });

  it("ensureVisitor creates a row for a new key", async () => {
    const created = makeUser({ id: "user-2", visitorKey: "fresh" });
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);
    const create = vi.spyOn(prisma.user, "create").mockResolvedValue(created);
    await expect(ensureVisitor("fresh")).resolves.toEqual(created);
    expect(create).toHaveBeenCalledWith({ data: { visitorKey: "fresh" } });
  });

  it("ensureVisitorWithCookie mints a key and attaches the cookie on first use", async () => {
    const created = makeUser({ id: "user-3", visitorKey: "minted" });
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);
    vi.spyOn(prisma.user, "create").mockResolvedValue(created);

    await ensureVisitorWithCookie();

    expect(cookieState.setCalls).toHaveLength(1);
    const call = cookieState.setCalls[0];
    expect(call.name).toBe(VISITOR_COOKIE_NAME);
    expect(call.value).toHaveLength(64); // randomBytes(32).hex
    expect(call.opts).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: false, // NODE_ENV=test → not production
      maxAge: VISITOR_COOKIE_MAX_AGE_SECONDS,
      path: "/",
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { visitorKey: call.value },
    });
  });

  it("ensureVisitorWithCookie reuses an existing cookie + row without writing", async () => {
    cookieState.values.set(VISITOR_COOKIE_NAME, "key-1");
    const user = makeUser();
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue(user);
    const create = vi.spyOn(prisma.user, "create");

    await expect(ensureVisitorWithCookie()).resolves.toEqual(user);
    expect(cookieState.setCalls).toHaveLength(0);
    expect(create).not.toHaveBeenCalled();
  });

  it("ensureVisitorWithCookie reuses a stale cookie key when creating the row", async () => {
    cookieState.values.set(VISITOR_COOKIE_NAME, "stale-key");
    const created = makeUser({ id: "user-4", visitorKey: "stale-key" });
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);
    vi.spyOn(prisma.user, "create").mockResolvedValue(created);

    await ensureVisitorWithCookie();

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { visitorKey: "stale-key" },
    });
  });
});
