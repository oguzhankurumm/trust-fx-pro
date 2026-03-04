"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Settings, TrendingUp, LogOut, Shield, Building2, Wallet } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { href: "/admin", label: "Genel Bakış", icon: LayoutDashboard, exact: true },
  { href: "/admin/kullanicilar", label: "Kullanıcılar", icon: Users },
  { href: "/admin/islemler", label: "Finansal İşlemler", icon: Wallet },
  { href: "/admin/banka-hesaplari", label: "Banka Hesapları", icon: Building2 },
  { href: "/admin/ayarlar", label: "Ayarlar", icon: Settings },
];

interface AdminSidebarProps {
  user: { name?: string | null; email?: string | null } | null;
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-bg-surface">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger/10 border border-danger/30">
            <Shield className="h-3.5 w-3.5 text-danger" />
          </div>
          <span className="font-bold text-sm text-text-primary">
            Trust<span className="text-brand">FX</span>
            <span className="text-xs font-normal text-danger ml-0.5">Admin</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {adminNavItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-danger/10 text-danger border border-danger/20"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
        <div className="pt-2 border-t border-border mt-2">
          <Link
            href="/panel"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-colors"
          >
            <TrendingUp className="h-4 w-4 shrink-0" />
            Kullanıcı Paneline Git
          </Link>
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-border p-3 space-y-1">
        <div className="px-3 py-2">
          <p className="text-xs text-danger font-medium">Admin</p>
          <p className="text-sm font-medium text-text-primary truncate">
            {user?.name ?? user?.email ?? "Admin"}
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
