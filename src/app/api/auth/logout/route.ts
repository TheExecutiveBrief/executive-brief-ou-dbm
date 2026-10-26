import { NextResponse } from "next/server";
import { clearSession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  await clearSession();
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

export async function GET(request: Request) {
  await clearSession();
  const url = new URL(request.url);
  const redirectTarget = url.searchParams.get("redirect") || "/admin/login";
  const response = NextResponse.redirect(new URL(redirectTarget, request.url));
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
