"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, ArrowLeftRight, User, TrendingUp, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/panel", label: "Gösterge Paneli", icon: LayoutDashboard, exact: true },
  { href: "/panel/cuzdan", label: "Cüzdan", icon: Wallet },
  { href: "/panel/islemler", label: "İşlemler", icon: ArrowLeftRight },
  { href: "/panel/profil", label: "Profil", icon: User },
];

interface PanelSidebarProps {
  user: { name?: string | null; email?: string | null } | null;
}

export function PanelSidebar({ user }: PanelSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-bg-surface">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 border border-brand/30">
            <TrendingUp className="h-3.5 w-3.5 text-brand" />
          </div>
          <span className="font-bold text-sm text-text-primary">
            Trust<span className="text-brand">FX</span>
            <span className="text-xs font-normal text-text-muted ml-0.5">Pro</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand/10 text-brand border border-brand/20"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-border p-3 space-y-1">
        <div className="px-3 py-2">
          <p className="text-xs text-text-muted">Giriş yapıldı</p>
          <p className="text-sm font-medium text-text-primary truncate">
            {user?.name ?? user?.email ?? "Kullanıcı"}
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
