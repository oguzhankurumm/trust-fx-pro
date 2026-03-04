import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const isAdmin = session?.user?.role === "ADMIN";

  const path = nextUrl.pathname;

  // Admin routes — require ADMIN role
  if (path.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(`/giris?callbackUrl=${encodeURIComponent(path)}`, nextUrl)
      );
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/panel", nextUrl));
    }
    return NextResponse.next();
  }

  // Panel routes — require any authenticated session
  if (path.startsWith("/panel")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(`/giris?callbackUrl=${encodeURIComponent(path)}`, nextUrl)
      );
    }
    return NextResponse.next();
  }

  // Auth pages — redirect logged-in users away
  if ((path === "/giris" || path === "/kayit") && isLoggedIn) {
    return NextResponse.redirect(new URL("/panel", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/panel/:path*",
    "/admin/:path*",
    "/giris",
    "/kayit",
    // Exclude static files and API routes
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
