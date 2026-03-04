"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { qk, fetchMarkets } from "@/lib/queries";
import { ArrowUp, ArrowDown, Plus, Minus } from "lucide-react";

const COINS = [
  { id: "polkadot", symbol: "DOT",  name: "Polkadot"  },
  { id: "ethereum", symbol: "ETH",  name: "Ethereum"  },
  { id: "bitcoin",  symbol: "BTC",  name: "Bitcoin"   },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche" },
  { id: "binancecoin", symbol: "BNB",  name: "BNB"     },
  { id: "near",     symbol: "NEAR", name: "Near"      },
  { id: "litecoin", symbol: "LTC",  name: "Litecoin"  },
];

const DURATIONS = [10, 15, 20, 25, 30, 35, 40];

interface TradeRecord {
  id: number;
  symbol: string;
  direction: "UP" | "DOWN";
  price: number;
  duration: number;
  time: string;
  result?: "WIN" | "LOSS" | "PENDING";
}

interface CoinData {
  id: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export default function TradingPage() {
  const [selectedCoin, setSelectedCoin] = useState(COINS[2]); // BTC default
  const [duration, setDuration]         = useState(10);
  const [trades, setTrades]             = useState<TradeRecord[]>([]);
  const [tradeId, setTradeId]           = useState(1);

  const { data: marketsData = [] } = useQuery({
    queryKey: qk.markets("try", 50),
    queryFn: () => fetchMarkets("try", 50),
    staleTime: 15_000,
    refetchInterval: 15_000,
  });

  const coinData = useMemo(() => {
    const map: Record<string, CoinData> = {};
    for (const c of marketsData) map[c.id] = c as CoinData;
    return map;
  }, [marketsData]);

  const currentData = coinData[selectedCoin.id];
  const price = currentData?.current_price ?? 0;
  const change = currentData?.price_change_percentage_24h ?? 0;

  const lossPct = 7.8 + duration * 0.1;
  const potentialLoss = price * lossPct / 100;

  function placeTrade(direction: "UP" | "DOWN") {
    const record: TradeRecord = {
      id: tradeId,
      symbol: selectedCoin.symbol,
      direction,
      price,
      duration,
      time: new Date().toLocaleTimeString("tr-TR"),
      result: "PENDING",
    };
    setTrades((prev) => [record, ...prev].slice(0, 10));
    setTradeId((n) => n + 1);

    // Simulate result after duration
    setTimeout(() => {
      setTrades((prev) =>
        prev.map((t) =>
          t.id === record.id
            ? { ...t, result: Math.random() > 0.5 ? "WIN" : "LOSS" }
            : t
        )
      );
    }, duration * 1000);
  }

  const fmtPrice = (n: number) =>
    n >= 1 ? n.toLocaleString("tr-TR", { maximumFractionDigits: 3 }) : n.toFixed(6);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Coin Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {COINS.map((coin) => {
          const active = coin.id === selectedCoin.id;
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
                <p className="font-bold text-white">{selectedCoin.symbol}</p>
                <p className="text-xs text-text-muted">
                  ₺{fmtPrice(price)}
                </p>
              </div>
            </div>
            <span className={`text-sm font-semibold ${change >= 0 ? "text-success" : "text-brand"}`}>
              {change >= 0 ? "+" : ""}{change.toFixed(2)}%
            </span>
          </div>

          {/* Chart area */}
          <div className="rounded-xl border border-border bg-bg-surface overflow-hidden" style={{ height: 360 }}>
            <iframe
              key={selectedCoin.symbol}
              src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=BINANCE:${selectedCoin.symbol}TRY&interval=1&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=040D1A&theme=dark&style=1&timezone=Europe%2FIstanbul&withdateranges=0&hideideas=1&locale=tr`}
              className="w-full h-full border-0"
              title={`${selectedCoin.symbol} Chart`}
              allowTransparency
            />
          </div>

          {/* Trade Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Direction buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => placeTrade("UP")}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-success/40 bg-success/5 p-5 hover:bg-success/10 transition-colors"
              >
                <ArrowUp className="h-8 w-8 text-success" />
                <span className="font-bold text-success tracking-wider">YUKARI</span>
              </button>
              <button
                onClick={() => placeTrade("DOWN")}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-brand/40 bg-brand/5 p-5 hover:bg-brand/10 transition-colors"
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
              {/* Slider */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="flex-1 h-2 rounded-full bg-bg-elevated cursor-pointer relative"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    const idx = Math.round(pct * (DURATIONS.length - 1));
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
                <button onClick={() => { const i = DURATIONS.indexOf(duration); if (i < DURATIONS.length - 1) setDuration(DURATIONS[i + 1]); }}
                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-border hover:bg-bg-elevated text-text-muted hover:text-white transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => { const i = DURATIONS.indexOf(duration); if (i > 0) setDuration(DURATIONS[i - 1]); }}
                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-border hover:bg-bg-elevated text-text-muted hover:text-white transition-colors">
                  <Minus className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* Preset buttons */}
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

          {/* Potential Gain/Loss */}
          <div className="rounded-xl border border-border bg-bg-surface p-4">
            <h3 className="text-sm font-semibold text-white mb-2">Potansiyel Kazanç/Kayıp</h3>
            <p className="text-2xl font-extrabold text-brand">
              ₺{fmtPrice(potentialLoss)}
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
            <p className="text-xs text-text-muted mb-1">Mevcut Fiyat</p>
            <p className="text-xl font-extrabold text-white">
              {price > 0 ? `₺${fmtPrice(price)}` : "Yükleniyor..."}
            </p>
          </div>

          {/* Trade History */}
          <div className="rounded-xl border border-border bg-bg-surface p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">İşlem Geçmişi</h3>
              <span className="text-xs text-text-muted">Son {trades.length} işlem</span>
            </div>
            {trades.length === 0 ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-10 rounded-lg bg-bg-elevated animate-pulse" />
                ))}
              </div>
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
                        : <ArrowDown className="h-3.5 w-3.5 text-brand" />
                      }
                      <span className="font-medium text-white">{t.symbol}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-text-muted">₺{fmtPrice(t.price)}</p>
                      <p className={
                        t.result === "WIN" ? "text-success" :
                        t.result === "LOSS" ? "text-brand" :
                        "text-text-muted"
                      }>
                        {t.result === "PENDING" ? `${t.duration}s` : t.result}
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
