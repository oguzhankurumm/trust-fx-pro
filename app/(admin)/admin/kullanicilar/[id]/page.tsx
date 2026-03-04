"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import { qk, fetchAdminUser } from "@/lib/queries";
import type { LedgerRow, BalanceRow } from "@/lib/queries";

const typeLabel: Record<string, string> = { DEPOSIT: "Yatırım", WITHDRAWAL: "Çekim", ADJUSTMENT: "Düzenleme" };
const statusLabel: Record<string, string> = { PENDING: "Beklemede", APPROVED: "Onaylandı", REJECTED: "Reddedildi", CANCELLED: "İptal" };

type BalAdjForm = { amount: string; type: string; currency: string; reason: string; adminPassword: string };

export default function KullaniciDetayPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: qk.adminUser(id),
    queryFn: () => fetchAdminUser(id),
    staleTime: 30_000,
  });

  const user = data?.user;
  const balances: BalanceRow[] = data?.balances ?? [];

  // ── Toggle block ──────────────────────────────────────────────────────────
  const blockMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("İşlem başarısız");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminUser(id) }),
  });

  // ── Balance adjust ────────────────────────────────────────────────────────
  const [balForm, setBalForm] = useState<BalAdjForm>({
    amount: "", type: "ADD", currency: "TRY", reason: "", adminPassword: "",
  });

  const balMutation = useMutation({
    mutationFn: async (form: BalAdjForm) => {
      const res = await fetch("/api/admin/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount), userId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Bir hata oluştu.");
      return data;
    },
    onSuccess: () => {
      setBalForm({ amount: "", type: "ADD", currency: "TRY", reason: "", adminPassword: "" });
      qc.invalidateQueries({ queryKey: qk.adminUser(id) });
    },
  });

  // ── Tx action ─────────────────────────────────────────────────────────────
  const txMutation = useMutation({
    mutationFn: async ({ txId, status }: { txId: string; status: "APPROVED" | "REJECTED" }) => {
      const res = await fetch(`/api/admin/transactions/${txId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Hata.");
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminUser(id) }),
  });

  if (isLoading) return <div className="text-text-muted py-8 text-center">Yükleniyor...</div>;
  if (isError || !user) return (
    <div className="text-center py-8">
      <p className="text-danger">Kullanıcı bulunamadı.</p>
      <Link href="/admin/kullanicilar" className="text-brand text-sm hover:underline">← Geri</Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/kullanicilar" className="text-text-muted hover:text-brand text-sm">← Kullanıcılar</Link>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <CardTitle>{user.name ?? user.email}</CardTitle>
              <p className="text-text-muted text-sm mt-1">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={user.status === "ACTIVE" ? "approved" : "rejected"}>
                {user.status === "ACTIVE" ? "Aktif" : "Engellendi"}
              </Badge>
              <Badge variant={user.role === "ADMIN" ? "danger" : "default"}>
                {user.role === "ADMIN" ? "Admin" : "Kullanıcı"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-muted">Kayıt Tarihi</p>
              <p className="text-text-primary">{formatDate(user.createdAt, true)}</p>
            </div>
            {balances.map((b) => (
              <div key={b.currency}>
                <p className="text-text-muted">{b.currency} Bakiye</p>
                <p className="text-text-primary font-numeric font-semibold">
                  {Number(b._sum.amount ?? 0).toFixed(2)} {b.currency}
                </p>
              </div>
            ))}
          </div>
          <div className="pt-2 flex items-center gap-2">
            <Button
              variant={user.status === "ACTIVE" ? "danger" : "secondary"}
              onClick={() => blockMutation.mutate(user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE")}
              loading={blockMutation.isPending}
            >
              {user.status === "ACTIVE" ? "Kullanıcıyı Engelle" : "Engeli Kaldır"}
            </Button>
            {blockMutation.isError && (
              <p className="text-xs text-danger">{(blockMutation.error as Error).message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Balance Adjust */}
      <Card>
        <CardHeader><CardTitle>Bakiye Düzenle</CardTitle></CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => { e.preventDefault(); balMutation.mutate(balForm); }}
            className="space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>İşlem Türü</Label>
                <select
                  value={balForm.type}
                  onChange={(e) => setBalForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/40"
                >
                  <option value="ADD">Ekle (+)</option>
                  <option value="SUBTRACT">Çıkar (−)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Para Birimi</Label>
                <select
                  value={balForm.currency}
                  onChange={(e) => setBalForm((f) => ({ ...f, currency: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/40"
                >
                  <option value="TRY">TRY</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Miktar</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={balForm.amount}
                onChange={(e) => setBalForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Gerekçe</Label>
              <Input
                value={balForm.reason}
                onChange={(e) => setBalForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Düzenleme gerekçesi"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Admin Şifresi (Onay)</Label>
              <Input
                type="password"
                value={balForm.adminPassword}
                onChange={(e) => setBalForm((f) => ({ ...f, adminPassword: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            {balMutation.isError && (
              <p className="text-xs text-danger">{(balMutation.error as Error).message}</p>
            )}
            {balMutation.isSuccess && (
              <p className="text-xs text-success">Bakiye başarıyla düzenlendi.</p>
            )}
            <Button type="submit" loading={balMutation.isPending}>
              Bakiyeyi Düzenle
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader><CardTitle>İşlemler</CardTitle></CardHeader>
        <CardContent>
          {user.ledgerEntries.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-4">İşlem yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="py-2 text-left text-xs text-text-muted font-medium">Tarih</th>
                    <th className="py-2 text-left text-xs text-text-muted font-medium">Tür</th>
                    <th className="py-2 text-right text-xs text-text-muted font-medium">Miktar</th>
                    <th className="py-2 text-center text-xs text-text-muted font-medium">Durum</th>
                    <th className="py-2 text-center text-xs text-text-muted font-medium">Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {user.ledgerEntries.map((tx: LedgerRow) => (
                    <tr key={tx.id}>
                      <td className="py-2 text-text-secondary">{formatDate(tx.createdAt, true)}</td>
                      <td className="py-2 text-text-primary">{typeLabel[tx.type] ?? tx.type}</td>
                      <td className={`py-2 text-right font-numeric ${Number(tx.amount) >= 0 ? "text-success" : "text-danger"}`}>
                        {Number(tx.amount) >= 0 ? "+" : ""}{Number(tx.amount).toFixed(2)} {tx.currency}
                      </td>
                      <td className="py-2 text-center">
                        <Badge variant={tx.status.toLowerCase() as "pending" | "approved" | "rejected" | "cancelled"}>
                          {statusLabel[tx.status] ?? tx.status}
                        </Badge>
                      </td>
                      <td className="py-2 text-center">
                        {tx.status === "PENDING" ? (
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => txMutation.mutate({ txId: tx.id, status: "APPROVED" })}
                              disabled={txMutation.isPending}
                              className="px-2 py-1 rounded-lg bg-success/10 text-success text-xs border border-success/20 hover:bg-success/20 disabled:opacity-50"
                            >
                              Onayla
                            </button>
                            <button
                              onClick={() => txMutation.mutate({ txId: tx.id, status: "REJECTED" })}
                              disabled={txMutation.isPending}
                              className="px-2 py-1 rounded-lg bg-danger/10 text-danger text-xs border border-danger/20 hover:bg-danger/20 disabled:opacity-50"
                            >
                              Reddet
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {txMutation.isError && (
            <p className="text-xs text-danger mt-2">{(txMutation.error as Error).message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
