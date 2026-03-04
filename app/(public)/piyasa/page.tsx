import React from "react";
import type { Metadata } from "next";
import { MarketPageClient } from "@/components/market/market-page-client";
import { TrendingUp, BarChart2, Coins, Bitcoin } from "lucide-react";

export const metadata: Metadata = {
  title: "Piyasa",
  description: "Kripto para piyasası - anlık fiyatlar, 24 saatlik değişim, piyasa değeri ve işlem hacmi.",
};

const MARKET_STATS = [
  {
    icon: TrendingUp,
    label: "Toplam Piyasa Değeri",
    value: "$2.47T",
    change: "+3.2%",
    up: true,
  },
  {
    icon: BarChart2,
    label: "24s İşlem Hacmi",
    value: "$98.5B",
    change: "+1.8%",
    up: true,
  },
  {
    icon: Coins,
    label: "Aktif Kripto Para",
    value: "13,217",
    change: "+5",
    up: true,
  },
  {
    icon: Bitcoin,
    label: "BTC Hakimiyeti",
    value: "54.3%",
    change: "-0.4%",
    up: false,
  },
];

export default function PiyasaPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-text-primary mb-2">Piyasa</h1>
        <p className="text-text-secondary">
          Tüm kripto paraların canlı fiyatlarını ve değişimlerini takip edin.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {MARKET_STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-bg-surface p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-brand" />
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  stat.up
                    ? "text-success bg-success/10"
                    : "text-brand bg-brand/10"
                }`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-muted mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <MarketPageClient />
    </div>
  );
}
