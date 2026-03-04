"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CoinIcon } from "@/components/ui/coin-icon";
import { Search, SlidersHorizontal, ArrowUpDown, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { qk, fetchMarkets } from "@/lib/queries";
import type { CoinMarket } from "@/types";

function fmtTry(n: number) {
  return n >= 1
    ? "₺" + n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })
    : "₺" + n.toFixed(6);
}

type SortKey = "market_cap" | "price" | "change";

export function MarketPageClient() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("market_cap");

  const { data: coins = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: qk.markets("try", 100),
    queryFn: () => fetchMarkets("try", 100),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const filtered = (coins as CoinMarket[])
    .filter(
      (c) =>
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.symbol.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortKey === "price") return (b.current_price ?? 0) - (a.current_price ?? 0);
      if (sortKey === "change") return (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0);
      return (b.market_cap ?? 0) - (a.market_cap ?? 0);
    });

  const sortLabels: Record<SortKey, string> = {
    market_cap: "Piyasa Değeri",
    price: "Fiyat",
    change: "24s Değişim",
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Coin ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 pl-9 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="appearance-none rounded-lg border border-border bg-bg-elevated px-3 py-2.5 pr-8 text-sm text-text-primary focus:border-brand focus:outline-none cursor-pointer"
            >
              {Object.entries(sortLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center justify-center rounded-lg border border-border bg-bg-elevated p-2.5 text-text-muted hover:text-brand hover:border-brand/30 transition-colors"
            disabled={isFetching}
            title="Yenile"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
          <button
            className="flex items-center justify-center rounded-lg border border-border bg-bg-elevated p-2.5 text-text-muted hover:text-brand hover:border-brand/30 transition-colors"
            title="Filtrele"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2">
        {(Object.keys(sortLabels) as SortKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setSortKey(k)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              sortKey === k
                ? "border-brand/40 bg-brand/10 text-brand"
                : "border-border bg-bg-surface text-text-muted hover:text-text-primary"
            }`}
          >
            <ArrowUpDown className="h-3 w-3" />
            {k === "market_cap" ? "Tümü" : sortLabels[k]}
          </button>
        ))}
      </div>

      {/* Section heading */}
      <div className="flex items-center gap-2 pt-2">
        <span className="text-brand text-base">$</span>
        <h2 className="text-base font-semibold text-text-primary">Kripto Para Piyasası</h2>
        {isFetching && !isLoading && (
          <span className="text-xs text-text-muted ml-auto">Güncelleniyor...</span>
        )}
      </div>

      {/* Table */}
      {isError ? (
        <div className="rounded-xl border border-border bg-bg-surface p-8 text-center">
          <p className="text-danger mb-3">Veri yüklenemedi.</p>
          <button
            onClick={() => refetch()}
            className="text-xs text-brand hover:underline"
          >
            Tekrar dene
          </button>
        </div>
      ) : isLoading ? (
        <div className="rounded-xl border border-border bg-bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 px-4 text-left text-xs font-medium text-text-muted">Coin</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-text-muted">Fiyat</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-text-muted">Alış</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-text-muted">Satış</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-text-muted">24s Değişim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-3 px-4"><div className="h-4 w-32 rounded bg-bg-elevated animate-pulse" /></td>
                    <td className="py-3 px-4 text-right"><div className="h-4 w-20 rounded bg-bg-elevated animate-pulse ml-auto" /></td>
                    <td className="py-3 px-4 text-right"><div className="h-4 w-20 rounded bg-bg-elevated animate-pulse ml-auto" /></td>
                    <td className="py-3 px-4 text-right"><div className="h-4 w-20 rounded bg-bg-elevated animate-pulse ml-auto" /></td>
                    <td className="py-3 px-4 text-right"><div className="h-4 w-14 rounded bg-bg-elevated animate-pulse ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th className="py-3 px-4 text-left text-xs font-medium">Coin</th>
                  <th className="py-3 px-4 text-right text-xs font-medium">Fiyat</th>
                  <th className="py-3 px-4 text-right text-xs font-medium">Alış</th>
                  <th className="py-3 px-4 text-right text-xs font-medium">Satış</th>
                  <th className="py-3 px-4 text-right text-xs font-medium">24s Değişim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((coin) => {
                  const chg = coin.price_change_percentage_24h ?? 0;
                  const price = coin.current_price ?? 0;
                  const buy = price * 0.999;
                  const sell = price * 1.001;
                  return (
                    <tr key={coin.id} className="hover:bg-bg-elevated transition-colors cursor-pointer">
                      <td className="py-3 px-4">
                        <Link href={`/piyasa/${coin.id}`} className="flex items-center gap-3">
                          <CoinIcon src={coin.image} symbol={coin.symbol} alt={coin.name} size={28} />
                          <div>
                            <p className="font-semibold text-white">{coin.symbol.toUpperCase()}</p>
                            <p className="text-xs text-text-muted">{coin.name}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-white">
                        {fmtTry(price)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-text-muted">
                        {fmtTry(buy)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-text-muted">
                        {fmtTry(sell)}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${chg >= 0 ? "text-success" : "text-danger"}`}>
                        {chg >= 0 ? "+" : ""}{chg.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-text-muted text-sm">
                &quot;{search}&quot; için sonuç bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
