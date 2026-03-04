"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ArrowDown, Plus, Minus, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import type { TickerData } from "@/app/api/crypto/ticker/route";

interface Coin {
  id: string;
  symbol: string;
  name: string;
}

const COINS: Coin[] = [
  { id: "polkadot",    symbol: "DOT",  name: "Polkadot"   },
  { id: "ethereum",   symbol: "ETH",  name: "Ethereum"   },
  { id: "bitcoin",    symbol: "BTC",  name: "Bitcoin"    },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche"  },
  { id: "binancecoin", symbol: "BNB",  name: "BNB"        },
  { id: "near",       symbol: "NEAR", name: "Near"       },
  { id: "litecoin",   symbol: "LTC",  name: "Litecoin"   },
];

const DURATIONS = [10, 15, 20, 25, 30, 35, 40];

interface TradeRecord {
  id: number;
  symbol: string;
  direction: "UP" | "DOWN";
  price: number;
  duration: number;
  time: string;
  result: "WIN" | "LOSS" | "PENDING";
}

const ALL_SYMBOLS = COINS.map((c) => c.symbol).join(",");

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

export default function TradingPage() {
  const [selectedCoin, setSelectedCoin] = useState(COINS[2]); // BTC
  const [duration, setDuration]         = useState<number>(10);
  const [trades, setTrades]             = useState<TradeRecord[]>([]);
  const [tradeCounter, setTradeCounter] = useState(1);

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
    staleTime: 4_000,
    refetchInterval: 5_000,          // Real-time: refresh every 5 seconds
    refetchIntervalInBackground: true,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
  });

  const tickerMap = useMemo(() => {
    const map: Record<string, TickerData> = {};
    for (const t of tickers) {
      // Binance symbol BTCTRY → strip "TRY" to get "BTC"
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

  const lossPct      = 7.8 + duration * 0.1;
  const potentialLoss = price > 0 ? (price * lossPct) / 100 : 0;

  function placeTrade(direction: "UP" | "DOWN") {
    if (price <= 0) return;
    const record: TradeRecord = {
      id: tradeCounter,
      symbol: selectedCoin.symbol,
      direction,
      price,
      duration,
      time: new Date().toLocaleTimeString("tr-TR"),
      result: "PENDING",
    };
    setTrades((prev) => [record, ...prev].slice(0, 10));
    setTradeCounter((n) => n + 1);

    setTimeout(() => {
      setTrades((prev) =>
        prev.map((t) =>
          t.id === record.id
            ? { ...t, result: Math.random() > 0.5 ? "WIN" : "LOSS" }
            : t
        )
      );
    }, duration * 1_000);
  }

  const fmtPrice = (n: number) =>
    n <= 0
      ? "—"
      : n >= 1
      ? "₺" + n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })
      : "₺" + n.toFixed(6);

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("tr-TR")
    : null;

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
              <span className={`h-5 w-5 flex items-center justify-center rounded-full text-[10px] font-bold ${active ? "bg-white/20" : "bg-bg-elevated"}`}>
                {coin.symbol[0]}
              </span>
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Main Area */}
        <div className="space-y-4">
          {/* Coin Header */}
          <div className="rounded-xl border border-border bg-bg-surface p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 flex items-center justify-center rounded-full bg-brand/10 border border-brand/20 text-xs font-bold text-brand">
                {selectedCoin.symbol[0]}
              </div>
              <div>
                <p className="font-bold text-white">{selectedCoin.symbol} / TRY</p>
                <p className="text-xs text-text-muted">
                  {isLoading
                    ? "Yükleniyor..."
                    : price > 0
                    ? fmtPrice(price)
                    : "Veri yok"}
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

          {/* 24h Stats row */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Direction buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => placeTrade("UP")}
                disabled={price <= 0}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-success/40 bg-success/5 p-5 hover:bg-success/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowUp className="h-8 w-8 text-success" />
                <span className="font-bold text-success tracking-wider">YUKARI</span>
              </button>
              <button
                onClick={() => placeTrade("DOWN")}
                disabled={price <= 0}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-brand/40 bg-brand/5 p-5 hover:bg-brand/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowDown className="h-8 w-8 text-brand" />
                <span className="font-bold text-brand tracking-wider">AŞAĞI</span>
              </button>
            </div>

            {/* Duration */}
            <div className="rounded-xl border border-border bg-bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-text-muted">Süre</span>
                <span className="text-sm font-bold text-success">{duration} saniye</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
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
          </div>

          {/* Potential Loss */}
          <div className="rounded-xl border border-border bg-bg-surface p-4">
            <h3 className="text-sm font-semibold text-white mb-2">Potansiyel Kazanç/Kayıp</h3>
            <p className="text-2xl font-extrabold text-brand">
              {price > 0 ? fmtPrice(potentialLoss) : "—"}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {duration} saniye içinde %{lossPct.toFixed(1)} kayıp
            </p>
          </div>
        </div>

        {/* Right Panel */}
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
                      <span className="h-5 w-5 flex items-center justify-center rounded-full bg-bg-elevated text-[9px] font-bold text-brand">
                        {coin.symbol[0]}
                      </span>
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
              <span className="text-xs text-text-muted">Son {trades.length} işlem</span>
            </div>
            {trades.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">
                Henüz işlem yapılmadı.
              </p>
            ) : (
              <div className="space-y-2">
                {trades.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between rounded-lg p-2.5 text-xs border ${
                      t.result === "WIN"
                        ? "border-success/20 bg-success/5"
                        : t.result === "LOSS"
                        ? "border-brand/20 bg-brand/5"
                        : "border-border bg-bg-elevated"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {t.direction === "UP"
                        ? <ArrowUp className="h-3.5 w-3.5 text-success" />
                        : <ArrowDown className="h-3.5 w-3.5 text-brand" />}
                      <div>
                        <p className="font-medium text-white">{t.symbol}</p>
                        <p className="text-text-muted">{t.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-text-muted">{fmtPrice(t.price)}</p>
                      <p className={
                        t.result === "WIN"     ? "text-success font-semibold" :
                        t.result === "LOSS"    ? "text-danger font-semibold"  :
                        "text-text-muted"
                      }>
                        {t.result === "PENDING" ? `${t.duration}s bekleniyor` : t.result}
                      </p>
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
