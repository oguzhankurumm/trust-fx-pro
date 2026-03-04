"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle, XCircle, Loader2, Search, RefreshCw,
  ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";
import { qk, fetchAdminTransactions, type AdminTransactionRow } from "@/lib/queries";

// ─── Constants ────────────────────────────────────────────────────────────────

type Tab = "pending" | "deposit" | "withdrawal" | "all";

const TABS: { id: Tab; label: string; icon?: React.ReactNode }[] = [
  { id: "pending",    label: "Bekleyen" },
  { id: "deposit",    label: "Yatırım Talepleri" },
  { id: "withdrawal", label: "Çekim Talepleri" },
  { id: "all",        label: "Tümü" },
];

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: "Yatırım",
  WITHDRAWAL: "Çekim",
  ADJUSTMENT: "Düzenleme",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "Beklemede",
  APPROVED:  "Onaylandı",
  REJECTED:  "Reddedildi",
  CANCELLED: "İptal",
};

const STATUS_VARIANTS: Record<string, "pending" | "approved" | "rejected" | "cancelled" | "default"> = {
  PENDING:   "pending",
  APPROVED:  "approved",
  REJECTED:  "rejected",
  CANCELLED: "cancelled",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tabToParams(tab: Tab): { type?: string; status?: string } {
  switch (tab) {
    case "pending":    return { status: "PENDING" };
    case "deposit":    return { type: "DEPOSIT" };
    case "withdrawal": return { type: "WITHDRAWAL" };
    case "all":        return {};
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminIslemlerPage() {
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>("pending");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const queryParams = {
    ...tabToParams(tab),
    page,
    q: search,
    currency: currencyFilter,
  };

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: qk.adminTransactions(queryParams),
    queryFn: () => fetchAdminTransactions(queryParams),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const transactions = data?.data?.transactions ?? [];
  const total = data?.data?.total ?? 0;
  const pageSize = data?.data?.pageSize ?? 20;
  const totalPages = Math.ceil(total / pageSize);

  // ── Approve / Reject mutation ──────────────────────────────────────────────
  const actionMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: "APPROVED" | "REJECTED"; reason?: string }) => {
      const res = await fetch(`/api/admin/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Hata oluştu.");
      return json;
    },
    onSuccess: () => {
      setRejectingId(null);
      setRejectReason("");
      qc.invalidateQueries({ queryKey: ["admin", "transactions"] });
    },
  });

  // ── Tab change resets page & filters ──────────────────────────────────────
  const handleTabChange = useCallback((t: Tab) => {
    setTab(t);
    setPage(1);
    setCurrencyFilter("");
    setSearch("");
    setSearchInput("");
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  // ── Pending count badge ────────────────────────────────────────────────────
  const { data: pendingData } = useQuery({
    queryKey: qk.adminTransactions({ status: "PENDING", page: 1 }),
    queryFn: () => fetchAdminTransactions({ status: "PENDING", page: 1 }),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
  const pendingCount = pendingData?.data?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Finansal İşlemler</h1>
          <p className="text-text-muted text-sm">Yatırım ve çekim taleplerini yönetin.</p>
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

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px ${
              tab === t.id
                ? "border-brand text-brand"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            {t.id === "deposit" && <ArrowDownCircle className="h-3.5 w-3.5" />}
            {t.id === "withdrawal" && <ArrowUpCircle className="h-3.5 w-3.5" />}
            {t.label}
            {t.id === "pending" && pendingCount > 0 && (
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-bg-base">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

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
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
              className="text-xs text-text-muted hover:text-danger"
            >
              Temizle
            </button>
          )}
        </form>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-text-muted" />
          <select
            value={currencyFilter}
            onChange={(e) => { setCurrencyFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            <option value="">Tüm Birimler</option>
            <option value="TRY">TRY</option>
            <option value="USDT">USDT</option>
          </select>
        </div>

        {total > 0 && (
          <span className="text-xs text-text-muted ml-auto">
            Toplam {total} işlem
          </span>
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
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-sm">
              {tab === "pending" ? "Bekleyen işlem yok." : "Bu filtreyle eşleşen işlem bulunamadı."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-bg-elevated/30">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs text-text-muted font-medium">Tarih</th>
                    <th className="py-3 px-4 text-left text-xs text-text-muted font-medium">Kullanıcı</th>
                    <th className="py-3 px-4 text-center text-xs text-text-muted font-medium">Tür</th>
                    <th className="py-3 px-4 text-right text-xs text-text-muted font-medium">Miktar</th>
                    <th className="py-3 px-4 text-center text-xs text-text-muted font-medium">Durum</th>
                    <th className="py-3 px-4 text-left text-xs text-text-muted font-medium">Not</th>
                    <th className="py-3 px-4 text-center text-xs text-text-muted font-medium">Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      isRejecting={rejectingId === tx.id}
                      rejectReason={rejectReason}
                      onApprove={() => actionMutation.mutate({ id: tx.id, status: "APPROVED" })}
                      onRejectStart={() => { setRejectingId(tx.id); setRejectReason(""); }}
                      onRejectConfirm={() => actionMutation.mutate({ id: tx.id, status: "REJECTED", reason: rejectReason })}
                      onRejectCancel={() => { setRejectingId(null); setRejectReason(""); }}
                      onRejectReasonChange={setRejectReason}
                      isActionPending={actionMutation.isPending && actionMutation.variables?.id === tx.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Error feedback */}
          {actionMutation.isError && (
            <p className="text-xs text-danger px-4 py-2 border-t border-border">
              {(actionMutation.error as Error).message}
            </p>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-text-muted">
                Sayfa {page} / {totalPages}
              </span>
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

// ─── TransactionRow sub-component ─────────────────────────────────────────────

interface RowProps {
  tx: AdminTransactionRow;
  isRejecting: boolean;
  rejectReason: string;
  onApprove: () => void;
  onRejectStart: () => void;
  onRejectConfirm: () => void;
  onRejectCancel: () => void;
  onRejectReasonChange: (v: string) => void;
  isActionPending: boolean;
}

function TransactionRow({
  tx, isRejecting, rejectReason,
  onApprove, onRejectStart, onRejectConfirm, onRejectCancel,
  onRejectReasonChange, isActionPending,
}: RowProps) {
  const amount = Number(tx.amount);
  const meta = tx.metadata as Record<string, unknown> | null;
  const note = (meta?.note as string) || (meta?.adminReason as string) || "";

  return (
    <>
      <tr className={`hover:bg-bg-elevated/40 transition-colors ${isRejecting ? "bg-danger/5" : ""}`}>
        {/* Date */}
        <td className="py-3 px-4 text-text-muted text-xs whitespace-nowrap">
          {formatDate(tx.createdAt, true)}
        </td>

        {/* User */}
        <td className="py-3 px-4">
          <Link
            href={`/admin/kullanicilar/${tx.user.id}`}
            className="hover:text-brand transition-colors"
          >
            <p className="text-text-primary text-sm font-medium truncate max-w-[160px]">
              {tx.user.name ?? tx.user.email}
            </p>
            {tx.user.name && (
              <p className="text-text-muted text-xs truncate max-w-[160px]">{tx.user.email}</p>
            )}
          </Link>
        </td>

        {/* Type */}
        <td className="py-3 px-4 text-center">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
            tx.type === "DEPOSIT"
              ? "bg-success/10 text-success border-success/20"
              : tx.type === "WITHDRAWAL"
                ? "bg-warning/10 text-warning border-warning/20"
                : "bg-brand/10 text-brand border-brand/20"
          }`}>
            {tx.type === "DEPOSIT" && <ArrowDownCircle className="h-2.5 w-2.5" />}
            {tx.type === "WITHDRAWAL" && <ArrowUpCircle className="h-2.5 w-2.5" />}
            {TYPE_LABELS[tx.type] ?? tx.type}
          </span>
        </td>

        {/* Amount */}
        <td className={`py-3 px-4 text-right font-numeric font-semibold tabular-nums ${
          amount >= 0 ? "text-success" : "text-danger"
        }`}>
          {amount >= 0 ? "+" : ""}{formatCurrency(Math.abs(amount), tx.currency as "TRY" | "USDT")}
        </td>

        {/* Status */}
        <td className="py-3 px-4 text-center">
          <Badge variant={STATUS_VARIANTS[tx.status] ?? "default"}>
            {STATUS_LABELS[tx.status] ?? tx.status}
          </Badge>
        </td>

        {/* Note */}
        <td className="py-3 px-4 max-w-[140px]">
          <span className="text-xs text-text-muted truncate block" title={note}>
            {note || "—"}
          </span>
        </td>

        {/* Actions */}
        <td className="py-3 px-4 text-center">
          {tx.status === "PENDING" ? (
            isRejecting ? (
              <span className="text-xs text-text-muted">↓ Gerekçe girin</span>
            ) : (
              <div className="flex justify-center items-center gap-1.5">
                <button
                  onClick={onApprove}
                  disabled={isActionPending}
                  title="Onayla"
                  className="p-1.5 rounded-lg bg-success/10 text-success border border-success/20 hover:bg-success/20 disabled:opacity-50 transition-colors"
                >
                  {isActionPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  onClick={onRejectStart}
                  disabled={isActionPending}
                  title="Reddet"
                  className="p-1.5 rounded-lg bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 disabled:opacity-50 transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          ) : (
            <span className="text-xs text-text-muted">—</span>
          )}
        </td>
      </tr>

      {/* Reject reason inline row */}
      {isRejecting && (
        <tr className="bg-danger/5 border-b border-danger/10">
          <td colSpan={7} className="px-4 py-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-danger font-medium shrink-0">Red Gerekçesi:</span>
              <input
                autoFocus
                value={rejectReason}
                onChange={(e) => onRejectReasonChange(e.target.value)}
                placeholder="İsteğe bağlı gerekçe..."
                className="flex-1 min-w-48 rounded-lg border border-danger/30 bg-bg-elevated px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-danger/30 placeholder:text-text-muted"
                onKeyDown={(e) => { if (e.key === "Enter") onRejectConfirm(); if (e.key === "Escape") onRejectCancel(); }}
              />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={onRejectConfirm}
                  disabled={isActionPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger text-white text-xs font-medium hover:bg-danger/90 disabled:opacity-50 transition-colors"
                >
                  {isActionPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                  Reddet
                </button>
                <button
                  onClick={onRejectCancel}
                  className="px-3 py-1.5 rounded-lg border border-border text-text-muted text-xs hover:text-text-primary hover:bg-bg-elevated transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
