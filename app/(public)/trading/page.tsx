"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowUp, ArrowDown, Plus, Minus, AlertCircle,
  RefreshCw, Loader2, Wallet, TrendingUp, TrendingDown,
  Clock, CheckCircle, XCircle, Lock,
} from "lucide-react";
import Link from "next/link";
import { CoinIcon } from "@/components/ui/coin-icon";
import type { TickerData } from "@/app/api/crypto/ticker/route";

interface Coin {
  id: string;
  symbol: string;
  name: string;
}

const COINS: Coin[] = [
  { id: "polkadot",     symbol: "DOT",  name: "Polkadot"  },
  { id: "ethereum",     symbol: "ETH",  name: "Ethereum"  },
  { id: "bitcoin",      symbol: "BTC",  name: "Bitcoin"   },
  { id: "avalanche-2",  symbol: "AVAX", name: "Avalanche" },
  { id: "binancecoin",  symbol: "BNB",  name: "BNB"       },
  { id: "near",         symbol: "NEAR", name: "Near"      },
  { id: "litecoin",     symbol: "LTC",  name: "Litecoin"  },
];

const DURATIONS = [10, 15, 20, 25, 30, 35, 40];
const BET_PRESETS = [10, 25, 50, 100, 250, 500];
const ALL_SYMBOLS = COINS.map((c) => c.symbol).join(",");

// Commission: 7.8 + duration * 0.1  (10s → 8.8%, 40s → 11.8%)
function commissionPct(duration: number): number {
  return 7.8 + duration * 0.1;
}
// Net profit multiplier on WIN: user gets back bet × (2 - commission%)
function winMultiplier(duration: number): number {
  return 2 - commissionPct(duration) / 100;
}

interface TradeRecord {
  id: string;
  symbol: string;
  direction: "UP" | "DOWN";
  entryPrice: number;
  betAmount: number;
  duration: number;
  createdAt: string | Date;
  result: "WIN" | "LOSS" | "PENDING";
  payout: number | null;
  resolvedAt: string | Date | null;
  countdown?: number;
}

async function fetchTickers(): Promise<TickerData[]> {
  const res = await fetch(`/api/crypto/ticker?symbols=${ALL_SYMBOLS}`);
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Fiyat verisi alınamadı");
  return json.data as TickerData[];
}

async function fetchBalance(): Promise<{ TRY: number; USDT: number }> {
  const res = await fetch("/api/panel/balance");
  if (!res.ok) return { TRY: 0, USDT: 0 };
  const json = await res.json();
  return json.data ?? { TRY: 0, USDT: 0 };
}

async function fetchHistory(): Promise<TradeRecord[]> {
  const res = await fetch("/api/trading/history?page=1");
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data?.trades ?? []) as TradeRecord[];
}

export default function TradingPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const qc = useQueryClient();
  const isLoggedIn = sessionStatus === "authenticated";

  const [selectedCoin, setSelectedCoin]   = useState(COINS[2]);
  const [duration, setDuration]           = useState<number>(10);
  const [betAmount, setBetAmount]          = useState<string>("100");
  const [localTrades, setLocalTrades]     = useState<TradeRecord[]>([]);
  // countdown displayed on the buttons (null = no active trade)
  const [activeCountdown, setActiveCountdown] = useState<number | null>(null);
  const resolveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const countdownIntervals = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // clean up all timers on unmount
  useEffect(() => {
    return () => {
      resolveTimers.current.forEach((t) => clearTimeout(t));
      countdownIntervals.current.forEach((t) => clearInterval(t));
    };
  }, []);

  // ── Tickers ──────────────────────────────────────────────────────────────────
  const {
    data: tickers = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["trading-tickers"],
    queryFn: fetchTickers,
    staleTime: 25_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
  });

  // ── Balance ───────────────────────────────────────────────────────────────────
  const { data: balanceData, refetch: refetchBalance } = useQuery({
    queryKey: ["panel-balance"],
    queryFn: fetchBalance,
    enabled: isLoggedIn,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
  const balance = balanceData?.TRY ?? 0;

  // ── Trade history (DB) ────────────────────────────────────────────────────────
  const { data: dbHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: ["trading-history"],
    queryFn: fetchHistory,
    enabled: isLoggedIn,
    staleTime: 5_000,
    refetchInterval: 10_000,
  });

  const tickerMap = useMemo(() => {
    const map: Record<string, TickerData> = {};
    for (const t of tickers) {
      const sym = t.symbol.replace("TRY", "");
      map[sym] = t;
    }
    return map;
  }, [tickers]);

  const currentTicker = tickerMap[selectedCoin.symbol] ?? null;
  const price  = currentTicker?.lastPrice  ?? 0;
  const change = currentTicker?.priceChangePercent ?? 0;
  const high   = currentTicker?.highPrice  ?? 0;
  const low    = currentTicker?.lowPrice   ?? 0;

  const bet = parseFloat(betAmount) || 0;
  const multiplier = winMultiplier(duration);
  const commission = commissionPct(duration);
  const potentialWin = bet > 0 ? bet * multiplier : 0;
  const potentialNetProfit = bet > 0 ? potentialWin - bet : 0;

  // ── Place trade mutation ──────────────────────────────────────────────────────
  const placeMutation = useMutation({
    mutationFn: async (direction: "UP" | "DOWN") => {
      const res = await fetch("/api/trading/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: selectedCoin.symbol,
          direction,
          entryPrice: price,
          betAmount: bet,
          duration,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "İşlem başarısız.");
      return json.data as { tradeId: string; potentialPayout: number; newBalance: number };
    },
    onSuccess: (data, direction) => {
      qc.invalidateQueries({ queryKey: ["panel-balance"] });
      refetchBalance();

      const tradeDuration = duration;

      const newTrade: TradeRecord = {
        id: data.tradeId,
        symbol: selectedCoin.symbol,
        direction,
        entryPrice: price,
        betAmount: bet,
        duration: tradeDuration,
        createdAt: new Date(),
        result: "PENDING",
        payout: null,
        resolvedAt: null,
        countdown: tradeDuration,
      };
      setLocalTrades((prev) => [newTrade, ...prev].slice(0, 15));

      // Drive both the trade history countdown and the button countdown
      let remaining = tradeDuration;
      setActiveCountdown(remaining);

      const countdownId = setInterval(() => {
        remaining -= 1;
        setActiveCountdown(remaining > 0 ? remaining : 0);
        setLocalTrades((prev) =>
          prev.map((t) => (t.id === data.tradeId ? { ...t, countdown: remaining } : t))
        );
        if (remaining <= 0) clearInterval(countdownId);
      }, 1000);
      countdownIntervals.current.set(data.tradeId, countdownId);

      // Resolve after duration
      const resolveId = setTimeout(async () => {
        clearInterval(countdownId);
        countdownIntervals.current.delete(data.tradeId);
        setActiveCountdown(null);

        try {
          const exitPrice = tickerMap[selectedCoin.symbol]?.lastPrice ?? price;
          const res = await fetch("/api/trading/resolve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tradeId: data.tradeId, exitPrice }),
          });
          const json = await res.json();
          if (json.success) {
            setLocalTrades((prev) =>
              prev.map((t) =>
                t.id === data.tradeId
                  ? {
                      ...t,
                      result: json.data.result,
                      payout: json.data.payout,
                      resolvedAt: new Date(),
                      countdown: undefined,
                    }
                  : t
              )
            );
            refetchBalance();
            refetchHistory();
          }
        } catch {
          // silently fail — history will resync on next poll
        }
        resolveTimers.current.delete(data.tradeId);
      }, tradeDuration * 1000);

      resolveTimers.current.set(data.tradeId, resolveId);
    },
  });

  const handlePlaceTrade = useCallback(
    (direction: "UP" | "DOWN") => {
      // Not logged in → redirect to login
      if (!isLoggedIn) {
        router.push("/giris");
        return;
      }
      if (price <= 0) return;
      if (bet < 10) return;
      if (bet > balance) return;
      if (activeCountdown !== null) return; // trade already in progress
      placeMutation.mutate(direction);
    },
    [price, isLoggedIn, bet, balance, activeCountdown, placeMutation, router]
  );

  // Merge local (real-time countdown) + DB history
  const displayedTrades = useMemo(() => {
    const localIds = new Set(localTrades.map((t) => t.id));
    const merged = [
      ...localTrades,
      ...dbHistory.filter((t) => !localIds.has(t.id)),
    ];
    return merged.slice(0, 15);
  }, [localTrades, dbHistory]);

  const fmtPrice = (n: number) =>
    n <= 0
      ? "—"
      : n >= 1
      ? "₺" + n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })
      : "₺" + n.toFixed(6);

  const fmtCurrency = (n: number) =>
    "₺" + n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("tr-TR")
    : null;

  const isActiveTrade = activeCountdown !== null;
  // Buttons are always clickable (non-logged users get redirected), except:
  // - price not loaded yet
  // - trade in progress (countdown active)
  // - API call in flight
  const buttonDisabled = price <= 0 || isActiveTrade || placeMutation.isPending;
  // "Can trade" means all conditions met for actual placement
  const canTrade = isLoggedIn && price > 0 && bet >= 10 && bet <= balance && !isActiveTrade && !placeMutation.isPending;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">

      {/* Error Banner */}
      {isError && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            Fiyat verisi alınamadı: {error instanceof Error ? error.message : "Bağlantı hatası"}
          </span>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-medium hover:bg-danger/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
            Yenile
          </button>
        </div>
      )}

      {/* Login prompt — soft info, buttons themselves redirect */}
      {!isLoggedIn && sessionStatus !== "loading" && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-text-secondary">
          <AlertCircle className="h-4 w-4 shrink-0 text-brand" />
          <span className="flex-1 text-xs">
            YUKARI / AŞAĞI butonlarına tıklayarak{" "}
            <Link href="/giris" className="text-brand font-medium hover:underline">giriş yapabilirsiniz</Link>.
            {" "}Hesabınız yoksa{" "}
            <Link href="/kayit" className="text-brand font-medium hover:underline">ücretsiz kayıt olun</Link>.
          </span>
        </div>
      )}

      {/* Coin Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {COINS.map((coin) => {
          const active  = coin.id === selectedCoin.id;
          const ticker  = tickerMap[coin.symbol];
          const pct     = ticker?.priceChangePercent ?? null;
          return (
            <button
              key={coin.id}
              onClick={() => setSelectedCoin(coin)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border ${
                active
                  ? "bg-brand border-brand text-white"
                  : "border-border bg-bg-surface text-text-secondary hover:border-brand/30 hover:text-text-primary"
              }`}
            >
              <CoinIcon symbol={coin.symbol} size={20} />
              {coin.symbol}
              {pct !== null && !isLoading && (
                <span className={`text-[10px] font-semibold ${pct >= 0 ? "text-success" : "text-danger"}`}>
                  {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        {/* ── Main Area ─────────────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Coin Header */}
          <div className="rounded-xl border border-border bg-bg-surface p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CoinIcon symbol={selectedCoin.symbol} size={32} />
              <div>
                <p className="font-bold text-white">{selectedCoin.symbol} / TRY</p>
                <p className="text-xs text-text-muted">
                  {isLoading ? "Yükleniyor..." : price > 0 ? fmtPrice(price) : "Veri yok"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isFetching && !isLoading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted" />
              )}
              <span className={`text-sm font-semibold ${
                isLoading ? "text-text-muted" :
                change >= 0 ? "text-success" : "text-danger"
              }`}>
                {isLoading ? "—" : `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`}
              </span>
            </div>
          </div>

          {/* 24h Stats */}
          {!isLoading && price > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "24s Yüksek", value: fmtPrice(high), color: "text-success" },
                { label: "24s Düşük",  value: fmtPrice(low),  color: "text-danger"  },
                { label: "24s Değişim", value: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`, color: change >= 0 ? "text-success" : "text-danger" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border bg-bg-surface px-3 py-2.5 text-center">
                  <p className="text-[10px] text-text-muted mb-0.5">{stat.label}</p>
                  <p className={`text-xs font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Chart */}
          <div className="rounded-xl border border-border bg-bg-surface overflow-hidden" style={{ height: 360 }}>
            <iframe
              key={selectedCoin.symbol}
              src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=BINANCE:${selectedCoin.symbol}TRY&interval=1&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=040D1A&theme=dark&style=1&timezone=Europe%2FIstanbul&withdateranges=0&hideideas=1&locale=tr`}
              className="w-full h-full border-0"
              title={`${selectedCoin.symbol}/TRY Grafiği`}
            />
          </div>

          {/* Trade Controls */}
          <div className="rounded-xl border border-border bg-bg-surface p-4 space-y-4">
            <h3 className="text-sm font-semibold text-white">İşlem Parametreleri</h3>

            {/* Balance */}
            {isLoggedIn && (
              <div className="flex items-center justify-between rounded-lg bg-bg-elevated border border-border px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Wallet className="h-3.5 w-3.5" />
                  <span>Bakiye</span>
                </div>
                <span className="text-sm font-bold text-white">{fmtCurrency(balance)}</span>
              </div>
            )}

            {/* Bet Amount */}
            <div className="space-y-2">
              <label className="text-xs text-text-muted">Bahis Miktarı (TRY)</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">₺</span>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-border bg-bg-base text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                    placeholder="100"
                  />
                </div>
                {isLoggedIn && balance > 0 && (
                  <button
                    onClick={() => setBetAmount(String(Math.floor(balance)))}
                    className="px-3 py-2.5 rounded-lg border border-border text-xs text-text-muted hover:text-brand hover:border-brand/30 transition-colors whitespace-nowrap"
                  >
                    Tümü
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {BET_PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setBetAmount(String(p))}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      bet === p
                        ? "bg-brand text-white"
                        : "bg-bg-elevated text-text-muted hover:bg-brand/20 hover:text-brand"
                    }`}
                  >
                    ₺{p}
                  </button>
                ))}
              </div>
              {bet < 10 && betAmount !== "" && (
                <p className="text-xs text-danger">Minimum bahis ₺10.</p>
              )}
              {isLoggedIn && bet > balance && balance > 0 && (
                <p className="text-xs text-danger">Yetersiz bakiye.</p>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Süre</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-warning">Komisyon: %{commission.toFixed(1)}</span>
                  <span className="text-xs font-bold text-success">{duration} saniye</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 h-2 rounded-full bg-bg-elevated cursor-pointer relative"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct  = (e.clientX - rect.left) / rect.width;
                    const idx  = Math.round(pct * (DURATIONS.length - 1));
                    setDuration(DURATIONS[Math.max(0, Math.min(DURATIONS.length - 1, idx))]);
                  }}
                >
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${(DURATIONS.indexOf(duration) / (DURATIONS.length - 1)) * 100}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-brand border-2 border-white"
                    style={{ left: `calc(${(DURATIONS.indexOf(duration) / (DURATIONS.length - 1)) * 100}% - 8px)` }}
                  />
                </div>
                <button
                  onClick={() => { const i = DURATIONS.indexOf(duration); if (i < DURATIONS.length - 1) setDuration(DURATIONS[i + 1]); }}
                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-border hover:bg-bg-elevated text-text-muted hover:text-white transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => { const i = DURATIONS.indexOf(duration); if (i > 0) setDuration(DURATIONS[i - 1]); }}
                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-border hover:bg-bg-elevated text-text-muted hover:text-white transition-colors"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      duration === d
                        ? "bg-brand text-white"
                        : "bg-bg-elevated text-text-muted hover:bg-brand/20 hover:text-brand"
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            {/* Payout Summary */}
            {bet >= 10 && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-bg-elevated p-3">
                  <div className="text-center">
                    <p className="text-[10px] text-text-muted mb-0.5">Kazanılacak (Net)</p>
                    <p className="text-base font-extrabold text-success">+{fmtCurrency(potentialNetProfit)}</p>
                    <p className="text-[9px] text-text-muted">
                      {((multiplier - 1) * 100).toFixed(1)}% net kar
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-text-muted mb-0.5">Kaybedilecek</p>
                    <p className="text-base font-extrabold text-danger">-{fmtCurrency(bet)}</p>
                    <p className="text-[9px] text-text-muted">tüm bahis</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-bg-base border border-border/50 px-3 py-1.5">
                  <span className="text-[10px] text-text-muted">
                    Komisyon ({duration}s)
                  </span>
                  <span className="text-[10px] font-semibold text-warning">
                    %{commission.toFixed(1)}
                  </span>
                </div>
              </div>
            )}

            {/* Direction Buttons */}
            <div className="space-y-3">
              {/* Active trade countdown bar */}
              {isActiveTrade && (
                <div className="rounded-xl border border-brand/30 bg-brand/5 px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-brand flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      İşlem devam ediyor…
                    </span>
                    <span className="text-lg font-extrabold text-brand tabular-nums">
                      {activeCountdown}s
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-1000 ease-linear"
                      style={{
                        width: `${((activeCountdown ?? 0) / duration) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* UP button */}
                <button
                  onClick={() => handlePlaceTrade("UP")}
                  disabled={buttonDisabled}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all
                    ${isActiveTrade
                      ? "border-success/20 bg-success/3 cursor-not-allowed opacity-50"
                      : !isLoggedIn
                      ? "border-success/60 bg-success/5 hover:bg-success/15 hover:border-success active:scale-95 cursor-pointer"
                      : canTrade
                      ? "border-success/40 bg-success/5 hover:bg-success/15 hover:border-success active:scale-95 cursor-pointer"
                      : "border-success/20 bg-success/3 cursor-not-allowed opacity-50"
                    }`}
                >
                  {placeMutation.isPending ? (
                    <Loader2 className="h-8 w-8 text-success animate-spin" />
                  ) : isActiveTrade ? (
                    <Lock className="h-8 w-8 text-success/50" />
                  ) : (
                    <TrendingUp className="h-8 w-8 text-success" />
                  )}
                  <span className={`font-bold tracking-wider ${isActiveTrade ? "text-success/50" : "text-success"}`}>
                    YUKARI
                  </span>
                  <span className={`text-[10px] ${isActiveTrade ? "text-success/40" : "text-success/70"}`}>
                    {!isLoggedIn ? "Giriş yap →" : isActiveTrade ? "Bekleniyor" : "Fiyat artacak"}
                  </span>
                </button>

                {/* DOWN button */}
                <button
                  onClick={() => handlePlaceTrade("DOWN")}
                  disabled={buttonDisabled}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all
                    ${isActiveTrade
                      ? "border-danger/20 bg-danger/3 cursor-not-allowed opacity-50"
                      : !isLoggedIn
                      ? "border-danger/60 bg-danger/5 hover:bg-danger/15 hover:border-danger active:scale-95 cursor-pointer"
                      : canTrade
                      ? "border-danger/40 bg-danger/5 hover:bg-danger/15 hover:border-danger active:scale-95 cursor-pointer"
                      : "border-danger/20 bg-danger/3 cursor-not-allowed opacity-50"
                    }`}
                >
                  {placeMutation.isPending ? (
                    <Loader2 className="h-8 w-8 text-danger animate-spin" />
                  ) : isActiveTrade ? (
                    <Lock className="h-8 w-8 text-danger/50" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-danger" />
                  )}
                  <span className={`font-bold tracking-wider ${isActiveTrade ? "text-danger/50" : "text-danger"}`}>
                    AŞAĞI
                  </span>
                  <span className={`text-[10px] ${isActiveTrade ? "text-danger/40" : "text-danger/70"}`}>
                    {!isLoggedIn ? "Giriş yap →" : isActiveTrade ? "Bekleniyor" : "Fiyat düşecek"}
                  </span>
                </button>
              </div>
            </div>

            {placeMutation.isError && (
              <p className="text-xs text-center text-danger">
                {(placeMutation.error as Error).message}
              </p>
            )}

            {!isLoggedIn && sessionStatus !== "loading" && (
              <p className="text-center text-xs text-text-muted">
                Butona tıklayarak giriş sayfasına yönlendirileceksiniz.
              </p>
            )}
            {isLoggedIn && balance === 0 && !isActiveTrade && (
              <p className="text-center text-xs text-text-muted">
                Bakiye yüklemek için{" "}
                <Link href="/panel/cuzdan" className="text-brand hover:underline">cüzdan sayfasına</Link> gidin.
              </p>
            )}
            {isLoggedIn && bet > balance && balance > 0 && !isActiveTrade && (
              <p className="text-center text-xs text-danger">
                Bahis miktarı bakiyenizden fazla. Miktarı düşürün veya{" "}
                <Link href="/panel/cuzdan" className="underline">bakiye yükleyin</Link>.
              </p>
            )}
          </div>
        </div>

        {/* ── Right Panel ──────────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Current Price */}
          <div className="rounded-xl border border-border bg-bg-surface p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-text-muted">Mevcut Fiyat</p>
              {lastUpdated && (
                <p className="text-[10px] text-text-muted opacity-60">{lastUpdated}</p>
              )}
            </div>
            {isLoading ? (
              <div className="space-y-2 mt-2">
                <div className="h-7 w-36 rounded-lg bg-bg-elevated animate-pulse" />
                <div className="h-3 w-20 rounded bg-bg-elevated animate-pulse" />
              </div>
            ) : isError ? (
              <div className="flex items-center gap-2 text-danger text-sm mt-1">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Yüklenemedi</span>
              </div>
            ) : (
              <>
                <p className="text-xl font-extrabold text-white">{fmtPrice(price)}</p>
                <p className={`text-xs font-medium mt-0.5 ${change >= 0 ? "text-success" : "text-danger"}`}>
                  {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(2)}% (24s)
                </p>
              </>
            )}
          </div>

          {/* All Coins Mini Ticker */}
          <div className="rounded-xl border border-border bg-bg-surface p-4">
            <p className="text-xs font-semibold text-text-muted mb-3">Tüm Coinler</p>
            <div className="space-y-2">
              {COINS.map((coin) => {
                const t   = tickerMap[coin.symbol];
                const pct = t?.priceChangePercent ?? null;
                const lp  = t?.lastPrice ?? 0;
                return (
                  <button
                    key={coin.id}
                    onClick={() => setSelectedCoin(coin)}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 transition-colors text-xs ${
                      coin.id === selectedCoin.id
                        ? "bg-brand/10 border border-brand/20"
                        : "hover:bg-bg-elevated border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CoinIcon symbol={coin.symbol} size={20} />
                      <span className="font-medium text-white">{coin.symbol}</span>
                    </div>
                    <div className="text-right">
                      {isLoading ? (
                        <div className="h-3 w-16 rounded bg-bg-elevated animate-pulse" />
                      ) : (
                        <>
                          <p className="font-mono text-text-secondary">{lp > 0 ? fmtPrice(lp) : "—"}</p>
                          {pct !== null && (
                            <p className={`text-[10px] ${pct >= 0 ? "text-success" : "text-danger"}`}>
                              {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trade History */}
          <div className="rounded-xl border border-border bg-bg-surface p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">İşlem Geçmişi</h3>
              <span className="text-xs text-text-muted">Son {displayedTrades.length} işlem</span>
            </div>

            {!isLoggedIn ? (
              <p className="text-xs text-text-muted text-center py-4">
                Geçmişi görmek için giriş yapın.
              </p>
            ) : displayedTrades.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">
                Henüz işlem yapılmadı.
              </p>
            ) : (
              <div className="space-y-2">
                {displayedTrades.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between rounded-lg p-2.5 text-xs border ${
                      t.result === "WIN"
                        ? "border-success/20 bg-success/5"
                        : t.result === "LOSS"
                        ? "border-danger/20 bg-danger/5"
                        : "border-border bg-bg-elevated"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {t.direction === "UP"
                        ? <ArrowUp className="h-3.5 w-3.5 text-success shrink-0" />
                        : <ArrowDown className="h-3.5 w-3.5 text-danger shrink-0" />}
                      <div>
                        <p className="font-medium text-white">{t.symbol}</p>
                        <p className="text-text-muted">
                          {typeof t.createdAt === "string"
                            ? new Date(t.createdAt).toLocaleTimeString("tr-TR")
                            : (t.createdAt as Date).toLocaleTimeString("tr-TR")}
                          {" · "}{t.duration}s
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-text-muted">{fmtCurrency(t.betAmount)}</p>
                      {t.result === "PENDING" ? (
                        <p className="text-text-muted flex items-center gap-1 justify-end">
                          <Clock className="h-3 w-3" />
                          {t.countdown !== undefined ? `${t.countdown}s` : "..."}
                        </p>
                      ) : t.result === "WIN" ? (
                        <p className="text-success font-semibold flex items-center gap-1 justify-end">
                          <CheckCircle className="h-3 w-3" />
                          +{fmtCurrency((t.payout ?? 0))}
                        </p>
                      ) : (
                        <p className="text-danger font-semibold flex items-center gap-1 justify-end">
                          <XCircle className="h-3 w-3" />
                          -{fmtCurrency(t.betAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
