"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Twitter, Facebook, Instagram, Github, ArrowRight, Home, BarChart2, User } from "lucide-react";

const MOBILE_NAV = [
  { href: "/",       Icon: Home,     label: "Anasayfa" },
  { href: "/piyasa", Icon: BarChart2, label: "Piyasa"   },
  { href: "/panel",  Icon: User,     label: "Profil"   },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const pathname = usePathname();

  return (
    <footer className="border-t border-border bg-bg-surface mt-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand + Newsletter */}
          <div className="lg:col-span-2">
            <Link href="/" className="block mb-3">
              <span className="font-bold text-xl text-brand tracking-tight">TrustFX Pro</span>
            </Link>
            <p className="text-sm text-text-muted mb-4 leading-relaxed max-w-xs">
              Kripto para dünyasındaki gelişmelerden haberdar olmak için bültenimize abone olun.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresiniz"
                className="flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setEmail("")}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dim transition-colors"
              >
                Abone Ol
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/", label: "Ana Sayfa" },
                { href: "/piyasa", label: "Piyasa" },
                { href: "/limitler", label: "Limitler" },
                { href: "/promosyonlar", label: "Promosyonlar" },
                { href: "/portfoy", label: "Portföy" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-text-muted hover:text-text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Şirket */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">Şirket</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/hakkimizda", label: "Hakkımızda" },
                { href: "/", label: "Blog" },
                { href: "/iletisim", label: "İletişim" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-text-muted hover:text-text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            © 2026 TrustFX Pro. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-3">
            {[
              { href: "https://twitter.com",  Icon: Twitter,   label: "Twitter"   },
              { href: "https://facebook.com", Icon: Facebook,  label: "Facebook"  },
              { href: "https://instagram.com",Icon: Instagram, label: "Instagram" },
              { href: "https://github.com",   Icon: Github,    label: "GitHub"    },
            ].map(({ href, Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="p-1.5 rounded-lg text-text-muted hover:text-brand transition-colors"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-text-muted">
          Bu platform yalnızca eğitim amaçlıdır ve gerçek finansal tavsiye içermez.
          Kripto para yatırımları yüksek risk içerebilir. Yatırım yapmadan önce kendi araştırmanızı yapmanız önerilir.
        </p>
      </div>

      {/* Mobile bottom navigation bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg-surface/95 backdrop-blur-md">
        <div className="flex items-center justify-around px-4 py-2">
          {MOBILE_NAV.map(({ href, Icon, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${
                  active ? "text-brand" : "text-text-muted hover:text-text-primary"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
