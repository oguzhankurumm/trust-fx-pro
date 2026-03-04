import React from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { auth } from "@/lib/auth";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col bg-bg-base">
      <Navbar user={session?.user ?? null} />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
