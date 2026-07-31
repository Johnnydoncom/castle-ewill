import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "./auth.config";
import { isAuthPage, requiresAdmin, requiresAuth } from "@/lib/auth/roles";

/**
 * Edge middleware. Uses the database-free Auth.js config so it can run on the
 * edge runtime; authorisation decisions are re-checked server-side in every
 * protected page and server action (defence in depth).
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  if (session && isAuthPage(pathname)) {
    return NextResponse.redirect(
      new URL(role === "admin" ? "/admin" : "/dashboard", req.nextUrl),
    );
  }

  if (!session && requiresAuth(pathname)) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (session && requiresAdmin(pathname) && role !== "admin") {
    return NextResponse.rewrite(new URL("/not-found", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Run on every route except Next.js internals, the auth API (which manages
     * its own session) and static asset requests.
     */
    "/((?!api/auth|_next/static|_next/image|images|favicon.png|robots.txt|sitemap.xml).*)",
  ],
};
