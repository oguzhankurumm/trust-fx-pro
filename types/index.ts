import type { LedgerType, LedgerStatus, Currency, Role, UserStatus } from "@prisma/client";

// ─── User ──────────────────────────────────────────────────────────────────────

export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  image: string | null;
}

export interface UserWithProfile extends SafeUser {
  profile: {
    name: string | null;
    phone: string | null;
  } | null;
}

// ─── Ledger ────────────────────────────────────────────────────────────────────

export interface LedgerEntryRow {
  id: string;
  userId: string;
  type: LedgerType;
  amount: string; // serialised Decimal
  currency: Currency;
  status: LedgerStatus;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface BalanceSummary {
  tryBalance: number;
  usdtBalance: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
}

// ─── Crypto / Market ───────────────────────────────────────────────────────────

export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  fully_diluted_valuation: number | null;
  total_volume: number | null;
  high_24h: number | null;
  low_24h: number | null;
  price_change_24h: number | null;
  price_change_percentage_24h: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  ath: number | null;
  atl: number | null;
  last_updated: string | null;
  sparkline_in_7d?: { price: number[] };
}

export interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  description: { tr?: string; en?: string };
  image: { thumb: string; small: string; large: string };
  market_data: {
    current_price: { usd: number; try: number };
    market_cap: { usd: number };
    total_volume: { usd: number };
    price_change_percentage_24h: number | null;
    price_change_percentage_7d: number | null;
    price_change_percentage_30d: number | null;
    ath: { usd: number };
    atl: { usd: number };
    circulating_supply: number | null;
    total_supply: number | null;
  };
  links: {
    homepage: string[];
    blockchain_site: string[];
    repos_url: { github: string[] };
  };
}

export interface ChartData {
  prices: number[][];
  market_caps: number[][];
  total_volumes: number[][];
}

export interface MarketsResponse {
  data: CoinMarket[];
  total: number;
  cached_at: string;
}

export interface CoinDetailResponse {
  coin: CoinDetail;
  chart_7d: ChartData;
  chart_30d: ChartData;
}

// ─── Admin ─────────────────────────────────────────────────────────────────────

export interface AdminAuditRow {
  id: string;
  adminId: string;
  admin: { email: string; name: string | null };
  actionType: string;
  targetUserId: string | null;
  targetUser: { email: string } | null;
  payload: Record<string, unknown>;
  createdAt: Date;
}

// ─── API Response Helpers ──────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
