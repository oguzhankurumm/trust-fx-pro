import React from "react";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "İşlemler" };

const ITEMS_PER_PAGE = 20;

const statusLabel: Record<string, string> = {
  PENDING: "Beklemede", APPROVED: "Onaylandı", REJECTED: "Reddedildi", CANCELLED: "İptal",
};
const typeLabel: Record<string, string> = {
  DEPOSIT: "Yatırım", WITHDRAWAL: "Çekim", ADJUSTMENT: "Düzenleme",
};

interface Props {
  searchParams: Promise<{ page?: string; type?: string; status?: string }>;
}

export default async function IslemlerPage({ searchParams }: Props) {
  const { page: pageStr, type, status } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const where: Record<string, unknown> = { userId };
  if (type && ["DEPOSIT", "WITHDRAWAL", "ADJUSTMENT"].includes(type)) where.type = type;
  if (status && ["PENDING", "APPROVED", "REJECTED", "CANCELLED"].includes(status)) where.status = status;

  const [entries, total] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.ledgerEntry.count({ where }),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">İşlem Geçmişi</h1>
        <p className="text-text-muted text-sm">Tüm yatırım, çekim ve düzenleme işlemleriniz.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle>İşlemler ({total})</CardTitle>
            <div className="flex gap-2 text-xs">
              {(["", "DEPOSIT", "WITHDRAWAL", "ADJUSTMENT"] as const).map((t) => (
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
                      <td className={`py-3 text-right font-numeric font-medium ${Number(tx.amount) >= 0 ? "text-success" : "text-danger"}`}>
                        {Number(tx.amount) >= 0 ? "+" : ""}{Number(tx.amount).toFixed(2)} {tx.currency}
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

          {/* Pagination */}
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
    </div>
  );
}
