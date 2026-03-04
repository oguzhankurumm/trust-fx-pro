import React from "react";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "İşlemler" };

const ITEMS_PER_PAGE = 20;

const statusLabel: Record<string, string> = {
  PENDING: "Beklemede", APPROVED: "Onaylandı", REJECTED: "Reddedildi", CANCELLED: "İptal",
};
const typeLabel: Record<string, string> = {
  DEPOSIT: "Yatırım", WITHDRAWAL: "Çekim", ADJUSTMENT: "Düzenleme", TRADE: "Trading",
};
const tradeResultLabel: Record<string, string> = {
  PENDING: "Beklemede", WIN: "Kazandı", LOSS: "Kaybetti",
};

interface Props {
  searchParams: Promise<{ page?: string; type?: string; tab?: string }>;
}

export default async function IslemlerPage({ searchParams }: Props) {
  const { page: pageStr, type, tab = "ledger" } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const skip = (page - 1) * ITEMS_PER_PAGE;

  let entries: {
    id: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: Date;
  }[] = [];
  let total = 0;

  let cryptoTrades: {
    id: string;
    symbol: string;
    direction: string;
    betAmount: number;
    payout: number | null;
    duration: number;
    result: string;
    createdAt: Date;
  }[] = [];
  let cryptoTotal = 0;

  if (tab === "trades") {
    const [raw, cnt] = await Promise.all([
      prisma.cryptoTrade.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: ITEMS_PER_PAGE,
      }),
      prisma.cryptoTrade.count({ where: { userId } }),
    ]);
    cryptoTrades = raw.map((t) => ({
      id: t.id,
      symbol: t.symbol,
      direction: t.direction,
      betAmount: Number(t.betAmount),
      payout: t.payout ? Number(t.payout) : null,
      duration: t.duration,
      result: t.result,
      createdAt: t.createdAt,
    }));
    cryptoTotal = cnt;
    total = cnt;
  } else {
    const where: Record<string, unknown> = { userId };
    if (type && ["DEPOSIT", "WITHDRAWAL", "ADJUSTMENT", "TRADE"].includes(type)) where.type = type;

    const [raw, cnt] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: ITEMS_PER_PAGE,
      }),
      prisma.ledgerEntry.count({ where }),
    ]);
    entries = raw.map((e) => ({
      id: e.id,
      type: e.type,
      amount: Number(e.amount),
      currency: e.currency,
      status: e.status,
      createdAt: e.createdAt,
    }));
    total = cnt;
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">İşlem Geçmişi</h1>
        <p className="text-text-muted text-sm">Tüm yatırım, çekim ve trading işlemleriniz.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-border">
        <a
          href="/panel/islemler?tab=ledger"
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab !== "trades"
              ? "border-brand text-brand"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Finansal İşlemler
        </a>
        <a
          href="/panel/islemler?tab=trades"
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "trades"
              ? "border-brand text-brand"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Trading Geçmişi
        </a>
      </div>

      {tab === "trades" ? (
        <Card>
          <CardHeader>
            <CardTitle>Trading İşlemleri ({cryptoTotal})</CardTitle>
          </CardHeader>
          <CardContent>
            {cryptoTrades.length === 0 ? (
              <p className="text-center text-text-muted py-8">Henüz trading işlemi yapılmadı.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="py-2 text-left text-xs text-text-muted font-medium">Tarih</th>
                      <th className="py-2 text-left text-xs text-text-muted font-medium">Coin</th>
                      <th className="py-2 text-center text-xs text-text-muted font-medium">Yön</th>
                      <th className="py-2 text-right text-xs text-text-muted font-medium">Bahis</th>
                      <th className="py-2 text-right text-xs text-text-muted font-medium">Kazanç</th>
                      <th className="py-2 text-center text-xs text-text-muted font-medium">Sonuç</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {cryptoTrades.map((t) => (
                      <tr key={t.id}>
                        <td className="py-3 text-text-secondary text-xs whitespace-nowrap">
                          {formatDate(t.createdAt, true)}
                        </td>
                        <td className="py-3 font-medium text-text-primary">{t.symbol}/TRY</td>
                        <td className="py-3 text-center">
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
                        <td className="py-3 text-right font-numeric text-text-secondary">
                          ₺{t.betAmount.toFixed(2)}
                        </td>
                        <td className={`py-3 text-right font-numeric font-medium ${
                          t.result === "WIN" ? "text-success" : t.result === "LOSS" ? "text-danger" : "text-text-muted"
                        }`}>
                          {t.result === "WIN"
                            ? `+₺${(t.payout ?? 0).toFixed(2)}`
                            : t.result === "LOSS"
                            ? `-₺${t.betAmount.toFixed(2)}`
                            : "—"}
                        </td>
                        <td className="py-3 text-center">
                          <Badge variant={
                            t.result === "WIN" ? "approved" :
                            t.result === "LOSS" ? "rejected" : "pending"
                          }>
                            {tradeResultLabel[t.result] ?? t.result}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <a
                    key={p}
                    href={`?tab=trades&page=${p}`}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      p === page
                        ? "bg-brand/10 text-brand border border-brand/30"
                        : "text-text-muted hover:text-text-secondary border border-border"
                    }`}
                  >
                    {p}
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>İşlemler ({total})</CardTitle>
              <div className="flex gap-2 text-xs">
                {(["", "DEPOSIT", "WITHDRAWAL", "ADJUSTMENT", "TRADE"] as const).map((t) => (
                  <a
                    key={t}
                    href={t ? `?type=${t}` : "/panel/islemler"}
                    className={`px-2.5 py-1 rounded-full border transition-colors ${
                      type === t || (!type && !t)
                        ? "bg-brand/10 border-brand/30 text-brand"
                        : "border-border text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    {t ? typeLabel[t] : "Tümü"}
                  </a>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-center text-text-muted py-8">İşlem bulunamadı.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="py-2 text-left text-xs text-text-muted font-medium">Tarih</th>
                      <th className="py-2 text-left text-xs text-text-muted font-medium">Tür</th>
                      <th className="py-2 text-right text-xs text-text-muted font-medium">Miktar</th>
                      <th className="py-2 text-center text-xs text-text-muted font-medium">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {entries.map((tx) => (
                      <tr key={tx.id}>
                        <td className="py-3 text-text-secondary">{formatDate(tx.createdAt, true)}</td>
                        <td className="py-3 font-medium text-text-primary">{typeLabel[tx.type] ?? tx.type}</td>
                        <td className={`py-3 text-right font-numeric font-medium ${tx.amount >= 0 ? "text-success" : "text-danger"}`}>
                          {tx.amount >= 0 ? "+" : ""}{tx.amount.toFixed(2)} {tx.currency}
                        </td>
                        <td className="py-3 text-center">
                          <Badge variant={tx.status.toLowerCase() as "pending" | "approved" | "rejected" | "cancelled"}>
                            {statusLabel[tx.status] ?? tx.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <a
                    key={p}
                    href={`?page=${p}${type ? `&type=${type}` : ""}`}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      p === page
                        ? "bg-brand/10 text-brand border border-brand/30"
                        : "text-text-muted hover:text-text-secondary border border-border"
                    }`}
                  >
                    {p}
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
