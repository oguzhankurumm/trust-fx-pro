import React from "react";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowDownCircle, ArrowUpCircle, Activity } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = { title: "Gösterge Paneli" };

export default async function PanelPage() {
  const session = await auth();
  const userId = session!.user.id;

  // Derive balance per currency
  const [tryBal, usdtBal, recentTxns] = await Promise.all([
    prisma.ledgerEntry.aggregate({
      where: { userId, status: "APPROVED", currency: "TRY" },
      _sum: { amount: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: { userId, status: "APPROVED", currency: "USDT" },
      _sum: { amount: true },
    }),
    prisma.ledgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const tryBalance = Number(tryBal._sum.amount ?? 0);
  const usdtBalance = Number(usdtBal._sum.amount ?? 0);

  const statusLabel: Record<string, string> = {
    PENDING: "Beklemede", APPROVED: "Onaylandı", REJECTED: "Reddedildi", CANCELLED: "İptal",
  };
  const typeLabel: Record<string, string> = {
    DEPOSIT: "Yatırım", WITHDRAWAL: "Çekim", ADJUSTMENT: "Düzenleme",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Hoş geldiniz, {session?.user?.name ?? "Kullanıcı"}
        </h1>
        <p className="text-text-muted text-sm">Hesap özetiniz aşağıda.</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-text-muted">TRY Bakiye</CardTitle>
              <div className="p-2 rounded-lg bg-brand/10"><Wallet className="h-4 w-4 text-brand" /></div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-numeric text-text-primary">
              ₺{tryBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-text-muted mt-1">Onaylanan bakiye</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-text-muted">USDT Bakiye</CardTitle>
              <div className="p-2 rounded-lg bg-success/10"><Wallet className="h-4 w-4 text-success" /></div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-numeric text-text-primary">
              ${usdtBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-text-muted mt-1">Onaylanan bakiye</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/panel/cuzdan", icon: ArrowDownCircle, label: "Yatırım Yap", color: "text-success" },
          { href: "/panel/cuzdan", icon: ArrowUpCircle, label: "Para Çek", color: "text-danger" },
          { href: "/panel/islemler", icon: Activity, label: "İşlemler", color: "text-brand" },
          { href: "/piyasa", icon: Activity, label: "Piyasa", color: "text-warning" },
        ].map((action) => (
          <Link key={action.label} href={action.href}>
            <div className="glass-card glass-card-hover p-4 flex flex-col items-center gap-2 text-center cursor-pointer">
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="text-xs font-medium text-text-secondary">{action.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Son İşlemler</CardTitle>
            <Link href="/panel/islemler" className="text-xs text-brand hover:underline">Tümünü Gör</Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentTxns.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">Henüz işlem bulunmuyor.</p>
          ) : (
            <div className="space-y-3">
              {recentTxns.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{typeLabel[tx.type] ?? tx.type}</p>
                    <p className="text-xs text-text-muted">{formatDate(tx.createdAt, true)}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className={`font-numeric text-sm font-medium ${Number(tx.amount) >= 0 ? "text-success" : "text-danger"}`}>
                      {Number(tx.amount) >= 0 ? "+" : ""}{Number(tx.amount).toFixed(2)} {tx.currency}
                    </span>
                    <Badge variant={tx.status.toLowerCase() as "pending" | "approved" | "rejected" | "cancelled"}>
                      {statusLabel[tx.status] ?? tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
