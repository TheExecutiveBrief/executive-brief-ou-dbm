import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/admin/:path*"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to the login page without a session
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Check for the editorial session cookie
  const sessionCookie = request.cookies.get("executive_brief_session");

  if (!sessionCookie || !sessionCookie.value) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
