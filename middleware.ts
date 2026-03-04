import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-edge";
import type { NextAuthRequest } from "next-auth";

export default auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isAuthenticated = !!session?.user;
  const role = (session?.user as { role?: string } | undefined)?.role?.toUpperCase();
  const isAdmin = role === "ADMIN";

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && (pathname === "/giris" || pathname === "/kayit")) {
    return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/panel", req.url));
  }

  // Protect /panel — must be authenticated
  if (pathname.startsWith("/panel") && !isAuthenticated) {
    return NextResponse.redirect(new URL("/giris", req.url));
  }

  // Protect /admin — must be ADMIN
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) return NextResponse.redirect(new URL("/giris", req.url));
    if (!isAdmin) return NextResponse.redirect(new URL("/panel", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/panel/:path*", "/admin/:path*", "/giris", "/kayit"],
};
