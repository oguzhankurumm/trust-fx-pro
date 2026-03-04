"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, User, BarChart2, Scale, Gift, TrendingUp } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const publicNavLinks = [
  { href: "/piyasa",      label: "Piyasa",       icon: BarChart2 },
  { href: "/limitler",   label: "Limitler",      icon: Scale },
  { href: "/promosyonlar", label: "Promosyonlar", icon: Gift },
  { href: "/trading",    label: "Trading",       icon: TrendingUp },
];

interface NavbarProps {
  user?: { name?: string | null; email?: string | null; role?: string } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-bg-surface/95 backdrop-blur-md border-b border-border shadow-lg shadow-bg-base/50"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-bold text-xl text-brand tracking-tight">
              TrustFX Pro
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {publicNavLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === link.href || pathname.startsWith(link.href + "/")
                      ? "text-brand bg-brand/10"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/panel">
                  <Button variant="secondary" size="sm">
                    <User className="h-4 w-4" />
                    Panel
                  </Button>
                </Link>
                {user.role === "ADMIN" && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">Admin</Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  title="Çıkış Yap"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Link href="/giris" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5">
                  Giriş Yap
                </Link>
                <Link href="/kayit">
                  <Button variant="primary" size="sm" className="bg-brand hover:bg-brand-dim">
                    Kayıt Ol
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menüyü aç/kapat"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-bg-surface/95 backdrop-blur-md">
          <div className="px-4 py-3 space-y-1">
            {publicNavLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                    pathname === link.href
                      ? "text-brand bg-brand/10"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-2 flex flex-col gap-2">
              {user ? (
                <>
                  <Link href="/panel" onClick={() => setMobileOpen(false)}>
                    <Button variant="secondary" size="sm" className="w-full">Panel</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                  >
                    Çıkış Yap
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/giris" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">Giriş Yap</Button>
                  </Link>
                  <Link href="/kayit" onClick={() => setMobileOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">Üye Ol</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// Drop-down user menu icon  
export { User };
