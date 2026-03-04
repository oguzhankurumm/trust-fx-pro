"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PortfoyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/giris?callbackUrl=/portfoy");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 mx-auto mb-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <p className="text-text-muted text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-2">Portföyüm</h1>
        <p className="text-text-muted">Kripto para portföyünüzü ve işlem geçmişinizi görüntüleyin.</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { href: "/panel", label: "Dashboard", sub: "Hesap özeti ve bakiye" },
          { href: "/panel/cuzdan", label: "Cüzdan", sub: "Para yatır ve çek" },
          { href: "/panel/islemler", label: "İşlemler", sub: "İşlem geçmişi" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between rounded-xl border border-border bg-bg-surface p-5 hover:border-brand/30 transition-colors group"
          >
            <div>
              <p className="font-semibold text-white">{item.label}</p>
              <p className="text-xs text-text-muted mt-0.5">{item.sub}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-brand transition-colors" />
          </Link>
        ))}
      </div>

      {/* Placeholder */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-bg-surface p-16 text-center">
        <div className="h-20 w-20 mb-5 flex items-center justify-center rounded-full bg-brand/10 border border-brand/20">
          <TrendingUp className="h-10 w-10 text-brand" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Portföy Yakında</h2>
        <p className="text-text-muted text-sm max-w-sm mb-6">
          Portföy takip özelliği yakında kullanıma girecek. Şimdiden işlem yapmak için trading sayfasını ziyaret edin.
        </p>
        <Link
          href="/trading"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dim transition-colors"
        >
          Trading&apos;e Git
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
