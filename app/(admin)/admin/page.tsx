import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin — Genel Bakış" };

export default async function AdminPage() {
  const [
    totalUsers,
    activeUsers,
    blockedUsers,
    pendingTx,
    recentAudits,
    txStats,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "BLOCKED" } }),
    prisma.ledgerEntry.count({ where: { status: "PENDING" } }),
    prisma.adminAudit.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { admin: { select: { email: true } }, targetUser: { select: { email: true } } },
    }),
    prisma.ledgerEntry.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const statusCount = Object.fromEntries(txStats.map((s) => [s.status, s._count.id]));

  const stats = [
    { label: "Toplam Kullanıcı", value: totalUsers, color: "text-brand" },
    { label: "Aktif Kullanıcı", value: activeUsers, color: "text-success" },
    { label: "Engellenen", value: blockedUsers, color: "text-danger" },
    { label: "Bekleyen İşlem", value: pendingTx, color: "text-warning" },
    { label: "Onaylanan İşlem", value: statusCount["APPROVED"] ?? 0, color: "text-success" },
    { label: "Reddedilen İşlem", value: statusCount["REJECTED"] ?? 0, color: "text-danger" },
  ];

  const actionLabel: Record<string, string> = {
    BALANCE_ADJUST: "Bakiye Düzenleme",
    APPROVE_TRANSACTION: "İşlem Onayı",
    REJECT_TRANSACTION: "İşlem Reddi",
    BLOCK_USER: "Kullanıcı Engellendi",
    UNBLOCK_USER: "Engel Kaldırıldı",
    BANK_ACCOUNT_CREATE: "Banka Hesabı Oluşturuldu",
    BANK_ACCOUNT_UPDATE: "Banka Hesabı Güncellendi",
    BANK_ACCOUNT_DELETE: "Banka Hesabı Silindi",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Genel Bakış</h1>
        <p className="text-text-muted text-sm">Platform istatistikleri ve son işlemler.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-2xl font-bold font-numeric ${s.color}`}>{s.value}</p>
              <p className="text-text-muted text-xs mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle>Son Admin Hareketleri</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAudits.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-4">Henüz hareket yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="py-2 text-left text-xs text-text-muted font-medium">Tarih</th>
                    <th className="py-2 text-left text-xs text-text-muted font-medium">Admin</th>
                    <th className="py-2 text-left text-xs text-text-muted font-medium">İşlem</th>
                    <th className="py-2 text-left text-xs text-text-muted font-medium">Hedef</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentAudits.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2 text-text-secondary">{formatDate(a.createdAt, true)}</td>
                      <td className="py-2 text-text-secondary text-xs">{a.admin.email}</td>
                      <td className="py-2">
                        <Badge variant="brand">{actionLabel[a.actionType] ?? a.actionType}</Badge>
                      </td>
                      <td className="py-2 text-text-muted text-xs">{a.targetUser?.email ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
