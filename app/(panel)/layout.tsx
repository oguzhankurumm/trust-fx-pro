import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PanelSidebar } from "@/components/layout/panel-sidebar";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/giris");

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      <PanelSidebar user={session.user} />
      <div className="flex-1 overflow-y-auto">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
