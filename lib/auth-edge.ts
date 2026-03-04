import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@prisma/client";

/**
 * Edge-compatible auth — JWT only, no database adapter.
 * Used by middleware.ts (runs on Netlify Edge / Deno runtime).
 * Full auth with PrismaAdapter lives in lib/auth.ts.
 */
export const { auth } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [Credentials({ credentials: {} })],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  pages: { signIn: "/giris", error: "/giris" },
});
