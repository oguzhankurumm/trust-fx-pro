"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2, Search, RefreshCw, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface TradeRow {
  id: string;
  symbol: string;
  direction: "UP" | "DOWN";
  entryPrice: number;
  exitPrice: number | null;
  betAmount: number;
  payout: number | null;
  duration: number;
  result: "PENDING" | "WIN" | "LOSS";
  createdAt: string;
  resolvedAt: string | null;
  user: { id: string; email: string; name: string | null };
}

const RESULT_LABEL: Record<string, string> = {
  PENDING: "Bekliyor",
  WIN: "Kazandı",
  LOSS: "Kaybetti",
};

async function fetchAdminTrades(params: {
  page: number;
  result: string;
  symbol: string;
  q: string;
}) {
  const p = new URLSearchParams();
  p.set("page", String(params.page));
  if (params.result) p.set("result", params.result);
  if (params.symbol) p.set("symbol", params.symbol);
  if (params.q) p.set("q", params.q);
  const res = await fetch(`/api/admin/trades?${p}`);
  if (!res.ok) throw new Error("Veriler yüklenemedi.");
  return res.json() as Promise<{
    success: boolean;
    data: { trades: TradeRow[]; total: number; page: number; pageSize: number };
  }>;
}

export default function AdminTradingPage() {
  const [page, setPage]               = useState(1);
  const [resultFilter, setResult]     = useState("");
  const [symbolFilter, setSymbol]     = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ]                     = useState("");

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["admin-trades", { page, resultFilter, symbolFilter, q }],
    queryFn: () => fetchAdminTrades({ page, result: resultFilter, symbol: symbolFilter, q }),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const trades    = data?.data?.trades    ?? [];
  const total     = data?.data?.total     ?? 0;
  const pageSize  = data?.data?.pageSize  ?? 25;
  const totalPages = Math.ceil(total / pageSize);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(searchInput);
    setPage(1);
  };

  const fmtMoney = (n: number) =>
    "₺" + n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-brand" />
            Trading İşlemleri
          </h1>
          <p className="text-text-muted text-sm">Tüm kullanıcıların binary trading geçmişi.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors text-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Yenile
        </button>
      </div>

      {/* Stats summary */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Toplam İşlem", value: total },
            { label: "Kazanan", value: trades.filter((t) => t.result === "WIN").length },
            { label: "Kaybeden", value: trades.filter((t) => t.result === "LOSS").length },
            { label: "Bekleyen", value: trades.filter((t) => t.result === "PENDING").length },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-bg-surface p-3 text-center">
              <p className="text-xs text-text-muted">{s.label}</p>
              <p className="text-lg font-bold text-text-primary mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Kullanıcı ara..."
              className="pl-9 pr-3 py-2 rounded-xl border border-border bg-bg-elevated text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 w-48"
            />
          </div>
          <Button type="submit" variant="secondary" className="py-2 px-3 text-sm">Ara</Button>
          {q && (
            <button
              type="button"
              onClick={() => { setQ(""); setSearchInput(""); setPage(1); }}
              className="text-xs text-text-muted hover:text-danger"
            >
              Temizle
            </button>
          )}
        </form>

        <select
          value={resultFilter}
          onChange={(e) => { setResult(e.target.value); setPage(1); }}
          className="rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/40"
        >
          <option value="">Tüm Sonuçlar</option>
          <option value="WIN">Kazandı</option>
          <option value="LOSS">Kaybetti</option>
          <option value="PENDING">Bekleyen</option>
        </select>

        <select
          value={symbolFilter}
          onChange={(e) => { setSymbol(e.target.value); setPage(1); }}
          className="rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/40"
        >
          <option value="">Tüm Coinler</option>
          {["BTC", "ETH", "BNB", "LTC", "DOT", "AVAX", "NEAR"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {total > 0 && (
          <span className="text-xs text-text-muted ml-auto">Toplam {total} işlem</span>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-text-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Yükleniyor...</span>
            </div>
          ) : isError ? (
            <div className="py-12 text-center">
              <p className="text-danger text-sm">Veriler yüklenirken hata oluştu.</p>
              <button onClick={() => refetch()} className="text-brand text-xs hover:underline mt-1">Tekrar dene</button>
            </div>
          ) : trades.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-sm">
              Eşleşen trading işlemi bulunamadı.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-bg-elevated/30">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs text-text-muted font-medium">Tarih</th>
                    <th className="py-3 px-4 text-left text-xs text-text-muted font-medium">Kullanıcı</th>
                    <th className="py-3 px-4 text-center text-xs text-text-muted font-medium">Coin</th>
                    <th className="py-3 px-4 text-center text-xs text-text-muted font-medium">Yön</th>
                    <th className="py-3 px-4 text-right text-xs text-text-muted font-medium">Giriş Fiyatı</th>
                    <th className="py-3 px-4 text-right text-xs text-text-muted font-medium">Bahis</th>
                    <th className="py-3 px-4 text-right text-xs text-text-muted font-medium">Kazanç/Kayıp</th>
                    <th className="py-3 px-4 text-center text-xs text-text-muted font-medium">Sonuç</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {trades.map((t) => {
                    const netPnl = t.result === "WIN"
                      ? (t.payout ?? 0) - t.betAmount
                      : t.result === "LOSS"
                      ? -t.betAmount
                      : null;
                    return (
                      <tr key={t.id} className="hover:bg-bg-elevated/40 transition-colors">
                        <td className="py-3 px-4 text-text-muted text-xs whitespace-nowrap">
                          {formatDate(t.createdAt, true)}
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/admin/kullanicilar/${t.user.id}`}
                            className="hover:text-brand transition-colors"
                          >
                            <p className="text-text-primary text-sm font-medium truncate max-w-[140px]">
                              {t.user.name ?? t.user.email}
                            </p>
                            {t.user.name && (
                              <p className="text-text-muted text-xs truncate max-w-[140px]">{t.user.email}</p>
                            )}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-text-primary">{t.symbol}</td>
                        <td className="py-3 px-4 text-center">
                          {t.direction === "UP" ? (
                            <span className="inline-flex items-center gap-1 text-success text-xs">
                              <ArrowUp className="h-3 w-3" /> Yukarı
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-danger text-xs">
                              <ArrowDown className="h-3 w-3" /> Aşağı
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-xs text-text-secondary font-mono">
                          {fmtMoney(t.entryPrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-numeric font-semibold text-text-primary">
                          {fmtMoney(t.betAmount)}
                        </td>
                        <td className={`py-3 px-4 text-right font-numeric font-semibold ${
                          netPnl === null ? "text-text-muted" :
                          netPnl > 0 ? "text-success" : "text-danger"
                        }`}>
                          {netPnl === null ? "—" : `${netPnl > 0 ? "+" : ""}${fmtMoney(netPnl)}`}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={
                            t.result === "WIN" ? "approved" :
                            t.result === "LOSS" ? "rejected" : "pending"
                          }>
                            {RESULT_LABEL[t.result]}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-text-muted">Sayfa {page} / {totalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                        p === page
                          ? "bg-brand/10 text-brand border-brand/30"
                          : "border-border text-text-muted hover:text-text-secondary"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
