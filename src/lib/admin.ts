import { redirect } from "next/navigation";
import bcrypt from "bcrypt";
import { getSessionUser } from "@/lib/session";

/**
 * Admin authorization (Plan.md admin spec).
 *
 * The session cookie stores only `sessionToken`. The `role` column is read
 * from the DB on each request — never trusted from the client.
 */

export async function getAdminUser() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
