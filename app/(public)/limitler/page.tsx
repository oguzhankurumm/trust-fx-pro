import React from "react";
import type { Metadata } from "next";
import { Info, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Limitler",
  description: "Coin platformunda geçerli olan işlem limitleri ve ücretler",
};

const coinLimits = [
  { coin: "TRY",  maker: "0.1%", taker: "0.1%", min: "100 TRY",       max: "1,000,000 TRY"   },
  { coin: "USDT", maker: "0.1%", taker: "0.1%", min: "10 USDT",       max: "100,000 USDT"    },
  { coin: "BTC",  maker: "0.1%", taker: "0.1%", min: "0.0001 BTC",    max: "10 BTC"          },
  { coin: "ETH",  maker: "0.1%", taker: "0.1%", min: "0.001 ETH",     max: "100 ETH"         },
  { coin: "BNB",  maker: "0.1%", taker: "0.1%", min: "0.01 BNB",      max: "1,000 BNB"       },
  { coin: "XRP",  maker: "0.1%", taker: "0.1%", min: "1 XRP",         max: "100,000 XRP"     },
  { coin: "ADA",  maker: "0.1%", taker: "0.1%", min: "1 ADA",         max: "1,000,000 ADA"   },
  { coin: "DOGE", maker: "0.1%", taker: "0.1%", min: "100 DOGE",      max: "10,000,000 DOGE" },
];

export default function LimitlerPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-2">İşlem Limitleri</h1>
        <p className="text-text-muted">Coin platformunda geçerli olan işlem limitleri ve ücretler</p>
      </div>

      {/* Fee Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[
          {
            title: "Maker Ücreti",
            desc: "Emir defterine emir vererek likidite sağlayan kullanıcılar için geçerli ücret",
            rate: "0.1%",
            sub: "Tüm coinler için geçerli maker ücreti",
          },
          {
            title: "Taker Ücreti",
            desc: "Emir defterindeki mevcut emirleri kabul eden kullanıcılar için geçerli ücret",
            rate: "0.1%",
            sub: "Tüm coinler için geçerli taker ücreti",
          },
        ].map((card) => (
          <div key={card.title} className="rounded-xl border border-border bg-bg-surface p-5">
            <div className="mb-3">
              <p className="font-semibold text-white text-sm">{card.title}</p>
              <p className="text-xs text-text-muted mt-1">{card.desc}</p>
            </div>
            <p className="text-3xl font-extrabold text-brand">{card.rate}</p>
            <p className="text-xs text-text-muted mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Coin Limits Table */}
      <div className="rounded-xl border border-border bg-bg-surface overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border">
          <p className="font-semibold text-white">Coin Bazlı Limitler</p>
          <p className="text-xs text-text-muted mt-0.5">Her coin için geçerli olan minimum ve maksimum işlem tutarları</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="px-5 py-3 text-left font-medium">Coin</th>
                <th className="px-5 py-3 text-left font-medium">Maker Ücreti</th>
                <th className="px-5 py-3 text-left font-medium">Taker Ücreti</th>
                <th className="px-5 py-3 text-left font-medium">Minimum İşlem</th>
                <th className="px-5 py-3 text-left font-medium">Maksimum İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coinLimits.map((row) => (
                <tr key={row.coin} className="hover:bg-bg-elevated transition-colors">
                  <td className="px-5 py-3 font-semibold text-white">{row.coin}</td>
                  <td className="px-5 py-3 text-text-secondary">{row.maker}</td>
                  <td className="px-5 py-3 text-text-secondary">{row.taker}</td>
                  <td className="px-5 py-3 text-text-secondary">{row.min}</td>
                  <td className="px-5 py-3 text-text-secondary">{row.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert boxes */}
      <div className="space-y-4">
        <div className="flex gap-3 rounded-xl border border-brand/20 bg-brand/5 p-4">
          <Info className="h-5 w-5 text-brand shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white text-sm mb-2">Önemli Bilgiler</p>
            <ul className="space-y-1 text-sm text-text-muted list-disc list-inside">
              <li>Tüm işlemler için maker ve taker ücretleri aynıdır</li>
              <li>İşlem ücretleri otomatik olarak işlem tutarından düşülür</li>
              <li>Minimum işlem tutarının altındaki işlemler gerçekleştirilemez</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 rounded-xl border border-warning/20 bg-warning/5 p-4">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white text-sm mb-2">Dikkat</p>
            <ul className="space-y-1 text-sm text-text-muted list-disc list-inside">
              <li>Maksimum işlem tutarı üzerindeki işlemler için lütfen destek ekibiyle iletişime geçin</li>
              <li>Ücretler ve limitler değişiklik gösterebilir</li>
              <li>İşlem yapmadan önce güncel limitleri kontrol edin</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
