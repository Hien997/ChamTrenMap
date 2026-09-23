import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME } from "@/config/constants";
import { adminOk } from "@/lib/api";
import { revokeAdminSession, verifyAdminToken } from "@/lib/admin-auth";

export async function POST() {
  // Server-side revocation first (ADR-0001): dropping the cookie alone would
  // leave a still-valid token in the DB until its expiry.
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value ?? null;
  const user = await verifyAdminToken(token);
  if (user) await revokeAdminSession(user.id);

  const response = adminOk();
  response.cookies.set(ADMIN_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}
