import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";
import { cryptoProvider } from "@/lib/crypto/coingecko";
import { auth } from "@/lib/auth";

interface Props {
  params: Promise<{ coinId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { coinId } = await params;
  try {
    const coin = await cryptoProvider.getCoin(coinId);
    return {
      title: `${coin.name} (${coin.symbol.toUpperCase()}) - Coin Detayları`,
      description: `${coin.name} anlık fiyat, grafik ve piyasa verileri.`,
    };
  } catch {
    return { title: "Coin Detayı" };
  }
}

// Map CoinGecko IDs to TradingView symbols
function tvSymbol(coinId: string, symbol: string): string {
  const overrides: Record<string, string> = {
    bitcoin: "BTCTRY",
    ethereum: "ETHTRY",
    binancecoin: "BNBTRY",
    ripple: "XRPTRY",
    cardano: "ADATRY",
    dogecoin: "DOGETRY",
    solana: "SOLTRY",
    polkadot: "DOTTRY",
    "avalanche-2": "AVAXTRY",
    litecoin: "LTCTRY",
    near: "NEARTRY",
    chainlink: "LINKTRY",
    uniswap: "UNITRY",
    "shiba-inu": "SHIBTRY",
    tron: "TRXTRY",
  };
  return overrides[coinId] ?? `${symbol.toUpperCase()}TRY`;
}

export default async function CoinDetailPage({ params }: Props) {
  const { coinId } = await params;
  const session = await auth();

  let coin;
  try {
    coin = await cryptoProvider.getCoin(coinId);
  } catch {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-danger text-lg mb-4">Coin verisi yüklenemedi.</p>
        <Link href="/piyasa" className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dim transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Piyasaya Dön
        </Link>
      </div>
    );
  }

  const tryPrice = coin.market_data.current_price.try ?? 0;
  const change24h = coin.market_data.price_change_percentage_24h ?? 0;
  const isPositive = change24h >= 0;

  const buyPrice = tryPrice * 0.9842; // ~1.58% spread like pumpvera
  const sellPrice = tryPrice * 1.0158;
  const spread = ((sellPrice - buyPrice) / tryPrice * 100).toFixed(2);
  const changeRange = Math.abs(change24h).toFixed(2);

  const fmtTry = (n: number) =>
    n >= 1 ? "₺" + n.toLocaleString("tr-TR", { maximumFractionDigits: 5 }) : "₺" + n.toFixed(8);

  const tvSym = tvSymbol(coinId, coin.symbol);
  const chartUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tv_coin&symbol=BINANCE:${tvSym}&interval=1&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=040D1A&theme=dark&style=1&timezone=Europe%2FIstanbul&withdateranges=0&hideideas=1&locale=tr&hide_top_toolbar=0`;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Back link */}
      <Link
        href="/piyasa"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-brand transition-colors mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Piyasaya Dön
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* ── Left Column ── */}
        <div className="space-y-4">
          {/* Coin header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Image
                src={coin.image.large}
                alt={coin.name}
                width={44}
                height={44}
                className="rounded-full shrink-0"
              />
              <div>
                <h1 className="text-xl font-extrabold text-white">{coin.symbol.toUpperCase()}</h1>
                <p className="text-xs text-text-muted">{coin.symbol.toUpperCase()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold font-mono text-white">{fmtTry(tryPrice)}</p>
              <p className={`text-sm font-semibold ${isPositive ? "text-success" : "text-brand"}`}>
                {isPositive ? "+" : ""}{change24h.toFixed(2)}%
              </p>
              <p className="text-xs text-text-muted mt-0.5">Son güncelleme: {new Date().toLocaleTimeString("tr-TR")}</p>
            </div>
          </div>

          {/* TradingView Chart */}
          <div className="rounded-xl border border-border bg-bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-white">Fiyat Grafiği</p>
              <p className="text-xs text-text-muted">{coin.symbol.toUpperCase()} fiyat değişimi</p>
            </div>
            <div style={{ height: 380 }}>
              <iframe
                key={coinId}
                src={chartUrl}
                className="w-full h-full border-0"
                title={`${coin.symbol.toUpperCase()} TradingView Chart`}
                allowTransparency
              />
            </div>
          </div>

          {/* Coin Bilgileri */}
          <div className="rounded-xl border border-border bg-bg-surface p-5">
            <h2 className="text-base font-semibold text-white mb-4">Coin Bilgileri</h2>
            <div className="mb-4">
              <h3 className="text-xs text-text-muted mb-1">Hakkında</h3>
              <p className="text-sm text-text-secondary">{coin.name} Coin</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <h4 className="text-xs text-text-muted mb-1">Alış Fiyatı</h4>
                <p className="text-sm font-semibold font-mono text-white">{fmtTry(buyPrice)}</p>
              </div>
              <div>
                <h4 className="text-xs text-text-muted mb-1">Satış Fiyatı</h4>
                <p className="text-sm font-semibold font-mono text-white">{fmtTry(sellPrice)}</p>
              </div>
              <div>
                <h4 className="text-xs text-text-muted mb-1">Spread</h4>
                <p className="text-sm font-semibold text-white">{spread}%</p>
              </div>
              <div>
                <h4 className="text-xs text-text-muted mb-1">Fiyat Değişim Aralığı</h4>
                <p className="text-sm font-semibold text-white">±{changeRange}%</p>
              </div>
              <div>
                <h4 className="text-xs text-text-muted mb-1">Güncelleme Aralığı</h4>
                <p className="text-sm font-semibold text-white">10 saniye</p>
              </div>
              <div>
                <h4 className="text-xs text-text-muted mb-1">Durum</h4>
                <span className="inline-flex items-center rounded-full bg-success/10 border border-success/20 px-2 py-0.5 text-xs font-semibold text-success">Aktif</span>
              </div>
            </div>

            {/* Trading tips */}
            <div className="border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-text-muted mb-2">İşlem İpuçları</h4>
              <ul className="space-y-1.5 text-xs text-text-muted">
                <li>• Alış fiyatı, coini satmak istediğinizde size ödenecek fiyattır.</li>
                <li>• Satış fiyatı, coini almak istediğinizde ödeyeceğiniz fiyattır.</li>
                <li>• Fiyatlar belirtilen güncelleme aralığında değişebilir.</li>
                <li>• İşlem yapmadan önce güncel fiyatları kontrol edin.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Right Column — İşlem Yap ── */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-bg-surface p-5 sticky top-20">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="h-4 w-4 text-brand" />
              <h2 className="text-base font-semibold text-white">İşlem Yap</h2>
            </div>
            <p className="text-xs text-text-muted mb-5">
              {coin.symbol.toUpperCase()} ({coin.symbol.toUpperCase()}) alım satım işlemleri
            </p>

            <div className="flex justify-between mb-4">
              <div>
                <p className="text-xs text-text-muted mb-0.5">Güncel Fiyat</p>
                <p className="text-lg font-extrabold font-mono text-white">{fmtTry(tryPrice)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted mb-0.5">24s Değişim</p>
                <p className={`text-lg font-extrabold ${isPositive ? "text-success" : "text-brand"}`}>
                  {isPositive ? "+" : ""}{change24h.toFixed(2)}%
                </p>
              </div>
            </div>

            {session?.user ? (
              <div className="space-y-3">
                <Link
                  href="/trading"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dim transition-colors"
                >
                  Trading Sayfasına Git
                </Link>
                <Link
                  href="/panel/cuzdan"
                  className="block text-center text-sm text-brand hover:underline"
                >
                  Bakiye yönetimi ve işlem geçmişi
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 p-3">
                  <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <p className="text-xs text-text-secondary">
                    İşlem yapmak için{" "}
                    <Link href="/giris" className="text-brand hover:underline font-medium">
                      giriş yapın
                    </Link>
                  </p>
                </div>
                <Link
                  href="/panel/cuzdan"
                  className="block text-center text-sm text-brand hover:underline"
                >
                  Bakiye yönetimi ve işlem geçmişi
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
