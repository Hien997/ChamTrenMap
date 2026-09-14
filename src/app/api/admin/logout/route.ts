import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/config/constants";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}
