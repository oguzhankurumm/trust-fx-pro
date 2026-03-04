/**
 * Centralised TanStack Query fetchers + key factories.
 * All components import from here for consistent cache sharing.
 */
import type { CoinMarket } from "@/types";

// ─── Key factories ────────────────────────────────────────────────────────────

export const qk = {
  markets: (currency: string, perPage: number) =>
    ["markets", currency, perPage] as const,
  coin: (id: string) => ["coin", id] as const,
  adminUsers: (page: number, search: string) =>
    ["admin", "users", page, search] as const,
  adminUser: (id: string) => ["admin", "user", id] as const,
  adminTransactions: (params: AdminTransactionParams) =>
    ["admin", "transactions", params] as const,
  panelTransactions: (page: number) => ["panel", "transactions", page] as const,
};

// ─── Fetchers ─────────────────────────────────────────────────────────────────

export async function fetchMarkets(currency = "try", perPage = 100) {
  const res = await fetch(
    `/api/crypto/markets?currency=${currency}&per_page=${perPage}`
  );
  if (!res.ok) throw new Error("Piyasa verisi alınamadı");
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Piyasa verisi alınamadı");
  return json.data as CoinMarket[];
}

export async function fetchAdminUsers(page: number, search: string) {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("q", search);
  const res = await fetch(`/api/admin/users?${params}`);
  if (!res.ok) throw new Error("Kullanıcılar yüklenemedi");
  return res.json() as Promise<{
    users: AdminUserRow[];
    total: number;
    page: number;
    pageSize: number;
  }>;
}

export async function fetchAdminUser(id: string) {
  const res = await fetch(`/api/admin/users/${id}`);
  if (!res.ok) throw new Error("Kullanıcı yüklenemedi");
  return res.json() as Promise<{
    user: UserDetail;
    balances: BalanceRow[];
  }>;
}

export async function fetchPanelTransactions(page: number) {
  const res = await fetch(`/api/panel/islemler?page=${page}`);
  if (!res.ok) throw new Error("İşlemler yüklenemedi");
  return res.json();
}

export type AdminTransactionParams = {
  page?: number;
  type?: string;
  status?: string;
  currency?: string;
  q?: string;
};

export async function fetchAdminTransactions(params: AdminTransactionParams) {
  const p = new URLSearchParams();
  if (params.page) p.set("page", String(params.page));
  if (params.type) p.set("type", params.type);
  if (params.status) p.set("status", params.status);
  if (params.currency) p.set("currency", params.currency);
  if (params.q) p.set("q", params.q);
  const res = await fetch(`/api/admin/transactions?${p}`);
  if (!res.ok) throw new Error("İşlemler yüklenemedi");
  return res.json() as Promise<{
    success: boolean;
    data: {
      transactions: AdminTransactionRow[];
      total: number;
      page: number;
      pageSize: number;
    };
  }>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: string;
  _count: { ledgerEntries: number };
};

export type UserDetail = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: string;
  ledgerEntries: LedgerRow[];
};

export type LedgerRow = {
  id: string;
  type: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};

export type BalanceRow = {
  currency: string;
  _sum: { amount: string | null };
};

export type AdminTransactionRow = {
  id: string;
  type: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  user: { id: string; email: string; name: string | null };
};
