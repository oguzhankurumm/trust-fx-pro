"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { qk, fetchMarkets } from "@/lib/queries";
import {
  Shield, Zap, Clock, Percent, BarChart2, Smile,
  Users, TrendingUp, Coins, ChevronDown, ChevronUp,
  ArrowRight, ArrowUpRight,
} from "lucide-react";

const stats = [
  { icon: Users,      label: "Aktif Kullanıcılar",  value: "12,500+",  sub: "Son 30 gün içinde aktif"     },
  { icon: TrendingUp, label: "İşlem Hacmi",          value: "₺243M+",   sub: "Toplam işlem hacmi"          },
  { icon: Coins,      label: "Desteklenen Coin",     value: "50+",      sub: "En popüler kripto paralar"  },
  { icon: Shield,     label: "Güvenlik",             value: "7/24",     sub: "Güvenli altyapı & 2FA"       },
];

const features = [
  { icon: Shield,    title: "Güvenli İşlem",       desc: "SSL şifreleme ve iki faktörlü kimlik doğrulama ile güvenli işlem yapın." },
  { icon: Zap,       title: "Hızlı İşlem",         desc: "Saniyeler içinde alım satım işlemlerinizi gerçekleştirin." },
  { icon: Clock,     title: "7/24 İşlem",          desc: "Günün her saati kesintisiz işlem yapma imkanı." },
  { icon: Percent,   title: "Düşük Komisyon",      desc: "Piyasadaki en düşük işlem ücretleriyle trading yapın." },
  { icon: BarChart2, title: "Gelişmiş Grafikler",  desc: "TradingView entegrasyonu ile profesyonel analiz araçları." },
  { icon: Smile,     title: "Kolay Kullanım",      desc: "Kullanıcı dostu arayüz ile basit ve hızlı işlemler." },
];

const tradingFeatures = [
  { icon: BarChart2, title: "Profesyonel Grafikler", sub: "TradingView entegrasyonu" },
  { icon: Shield,    title: "Güvenli İşlem",         sub: "SSL şifreleme"            },
  { icon: Zap,       title: "Hızlı İşlem",           sub: "Saniyeler içinde"         },
  { icon: Percent,   title: "Düşük Komisyon",        sub: "En uygun fiyatlar"        },
];

const faqs = [
  { q: "Kripto para nedir?",
    a: "Kripto para, şifreleme teknolojisi kullanılarak güvence altına alınan ve merkezi bir otoriteye bağlı olmayan dijital para birimidir." },
  { q: "Nasıl kripto para satın alabilirim?",
    a: "Hesap oluşturun, kimlik doğrulamanızı tamamlayın, TRY yükleyin ve istediğiniz kripto parayı satın alın." },
  { q: "İşlem ücretleri nelerdir?",
    a: "Maker ve taker işlemleri için %0,1 komisyon alınmaktadır. Daha fazla bilgi için Limitler sayfasını inceleyebilirsiniz." },
  { q: "Kripto paralarımı nasıl güvende tutabilirim?",
    a: "İki faktörlü kimlik doğrulama (2FA) aktifleştirin, güçlü şifre kullanın ve şüpheli bağlantılara tıklamayın." },
  { q: "Hangi kripto paraları alıp satabilirim?",
    a: "Bitcoin (BTC), Ethereum (ETH), BNB, XRP, ADA, DOGE ve 50'den fazla popüler kripto parayı işlem yapabilirsiniz." },
];

interface Coin {
  id: string; symbol: string; name: string;
  current_price: number; price_change_percentage_24h: number; image: string;
}

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { data: allCoins = [] } = useQuery({
    queryKey: qk.markets("try", 6),
    queryFn: () => fetchMarkets("try", 6),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const coins = allCoins.slice(0, 6) as Coin[];

  const fmtPrice = (n: number) =>
    n >= 1 ? n.toLocaleString("tr-TR", { maximumFractionDigits: 2 }) : n.toFixed(6);

  return (
    <div className="overflow-hidden">
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[80vh] flex items-center justify-center bg-bg-base">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand/5 blur-3xl" />
          <div className="absolute bottom-0 -left-32 h-96 w-96 rounded-full bg-brand/4 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-24 w-full text-center">
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
            <span className="gradient-text">Kripto Para Alım Satımı</span>
            <br />
            <span className="gradient-text">Artık Çok Kolay</span>
          </h1>
          <p className="text-text-secondary text-lg mb-10 leading-relaxed max-w-xl mx-auto">
            Güvenli, hızlı ve kolay bir şekilde kripto para alım satımı yapın.
            Gelişmiş grafikler ve anlık fiyat takibi ile piyasayı yakından izleyin.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/giris" className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dim transition-colors">
              Hemen Başla <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/piyasa" className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-surface px-6 py-3 font-semibold text-text-primary hover:bg-bg-elevated transition-colors">
              Canlı Piyasa
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Stats ──────────────────────────────────────────────────────────── */}
      <section className="bg-bg-surface py-12 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-white mb-8">Platform İstatistikleri</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s) => { const Icon = s.icon; return (
              <div key={s.label} className="flex items-start gap-3 p-4 rounded-xl bg-bg-elevated border border-border">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 border border-brand/20">
                  <Icon className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">{s.label}</p>
                  <p className="text-xl font-extrabold text-white">{s.value}</p>
                  <p className="text-xs text-text-muted">{s.sub}</p>
                </div>
              </div>
            );})}
          </div>
        </div>
      </section>

      {/* ─── Market Summary ─────────────────────────────────────────────── */}
      <section className="py-16 bg-bg-base">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">Piyasa Özeti</h2>
            <p className="text-text-muted text-sm">En popüler kripto paraların anından fiyatları ve 24 saatlik değişimlerini takip edin.</p>
          </div>
          <div className="rounded-xl border border-border bg-bg-surface overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Coins className="h-4 w-4 text-brand" />
              <span className="text-sm font-medium text-text-primary">Kripto Para Piyasası</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-text-muted">
                  <th className="px-4 py-3 text-left"></th>
                  <th className="px-4 py-3 text-left">Coin</th>
                  <th className="px-4 py-3 text-right">Fiyat</th>
                  <th className="px-4 py-3 text-right">Alış</th>
                  <th className="px-4 py-3 text-right">Satış</th>
                  <th className="px-4 py-3 text-right">24s Değişim</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {coins.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">Coin listesi yükleniyor...</td></tr>
                  ) : coins.map((c) => {
                    const chg = c.price_change_percentage_24h ?? 0;
                    return (
                      <tr key={c.id} className="hover:bg-bg-elevated transition-colors">
                        <td className="px-4 py-3"><Image src={c.image} alt={c.name} width={24} height={24} className="h-6 w-6 rounded-full" /></td>
                        <td className="px-4 py-3"><div className="font-semibold text-white">{c.symbol.toUpperCase()}</div><div className="text-xs text-text-muted">{c.name}</div></td>
                        <td className="px-4 py-3 text-right font-mono">₺{fmtPrice(c.current_price)}</td>
                        <td className="px-4 py-3 text-right font-mono text-text-muted">₺{fmtPrice(c.current_price * 0.999)}</td>
                        <td className="px-4 py-3 text-right font-mono text-text-muted">₺{fmtPrice(c.current_price * 1.001)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${chg >= 0 ? "text-success" : "text-brand"}`}>{chg >= 0 ? "+" : ""}{chg.toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border text-right">
              <Link href="/piyasa" className="text-sm text-brand hover:underline inline-flex items-center gap-1">Tüm Piyasayı Gör <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Neden Biz? ───────────────────────────────────────────────── */}
      <section className="py-16 bg-bg-surface border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Neden Biz?</h2>
              <p className="text-text-secondary mb-4">Güvenli ve Hızlı İşlem İmkanı</p>
              <p className="text-text-muted leading-relaxed">En son teknolojiler ve güvenlik önlemleriyle kripto para işlemlerinizi güvenle gerçekleştirin.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f) => { const Icon = f.icon; return (
                <div key={f.title} className="flex gap-3 p-4 rounded-xl bg-bg-elevated border border-border hover:border-brand/30 transition-colors">
                  <div className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-brand/10 border border-brand/20">
                    <Icon className="h-4 w-4 text-brand" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{f.title}</p>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );})}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trading Platform ───────────────────────────────────────────── */}
      <section className="py-16 bg-bg-base">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Profesyonel Trading Platformu</h2>
              <p className="text-text-secondary leading-relaxed mb-6">TradingView entegrasyonu ile gelişmiş teknik analiz araçları, gerçek zamanlı fiyat takibi ve profesyonel grafiklerle kripto para alım-satımı yapın.</p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link href="/trading" className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dim transition-colors">
                  Trading&apos;e Başla <ArrowRight className="h-4 w-4" />
                </Link>
                <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 font-semibold text-text-primary hover:bg-bg-elevated transition-colors">Daha Fazla Bilgi</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {tradingFeatures.map((f) => { const Icon = f.icon; return (
                  <div key={f.title} className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface border border-border">
                    <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-brand/10"><Icon className="h-4 w-4 text-brand" /></div>
                    <div><p className="text-sm font-medium text-white">{f.title}</p><p className="text-xs text-text-muted">{f.sub}</p></div>
                  </div>
                );})}
              </div>
            </div>
            <div className="flex items-center justify-center rounded-2xl bg-bg-surface border border-border p-8 min-h-[300px]">
              <div className="text-center">
                <div className="h-24 w-24 mx-auto mb-4 flex items-center justify-center rounded-full bg-brand/10 border border-brand/20">
                  <TrendingUp className="h-12 w-12 text-brand" />
                </div>
                <p className="text-text-muted text-sm">Profesyonel Trading Arayüzü</p>
                <Link href="/trading" className="mt-2 inline-block text-sm text-brand hover:underline">Hemen Dene →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Live Market ────────────────────────────────────────────────── */}
      <section className="py-16 bg-bg-surface border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Canlı Piyasa</h2>
              <p className="text-sm text-text-muted mt-1">Anlık Fiyat Takibi</p>
            </div>
            <Link href="/piyasa" className="text-sm text-brand hover:underline hidden sm:block">Tümünü Gör →</Link>
          </div>
          <div className="rounded-xl border border-border bg-bg-elevated overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Coins className="h-4 w-4 text-brand" />
              <span className="text-sm font-medium text-text-primary">Kripto Para Piyasası</span>
            </div>
            {coins.length === 0 ? (
              <div className="py-12 text-center text-text-muted text-sm">Fiyatlar yükleniyor...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-text-muted">
                    <th className="px-4 py-3 text-left"></th><th className="px-4 py-3 text-left">Coin</th>
                    <th className="px-4 py-3 text-right">Fiyat</th><th className="px-4 py-3 text-right">Alış</th>
                    <th className="px-4 py-3 text-right">Satış</th><th className="px-4 py-3 text-right">24s Değişim</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {coins.map((c) => { const chg = c.price_change_percentage_24h ?? 0; return (
                      <tr key={c.id} className="hover:bg-bg-surface transition-colors">
                        <td className="px-4 py-3"><Image src={c.image} alt={c.name} width={24} height={24} className="h-6 w-6 rounded-full" /></td>
                        <td className="px-4 py-3"><span className="font-semibold text-white">{c.symbol.toUpperCase()}</span><span className="ml-2 text-xs text-text-muted">{c.name}</span></td>
                        <td className="px-4 py-3 text-right font-mono text-white">₺{fmtPrice(c.current_price)}</td>
                        <td className="px-4 py-3 text-right font-mono text-text-muted">₺{fmtPrice(c.current_price * 0.999)}</td>
                        <td className="px-4 py-3 text-right font-mono text-text-muted">₺{fmtPrice(c.current_price * 1.001)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${chg >= 0 ? "text-success" : "text-brand"}`}>{chg >= 0 ? "+" : ""}{chg.toFixed(2)}%</td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-bg-base">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-3 py-1 text-xs font-medium text-brand mb-4">
                <div className="h-1.5 w-1.5 rounded-full bg-brand" />SSS
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Sıkça Sorulan Sorular</h3>
              <p className="text-text-muted text-sm leading-relaxed mb-8">Kripto para dünyasında merak ettiğiniz soruların cevaplarını burada bulabilirsiniz. Daha fazla sorunuz varsa, bize ulaşmaktan çekinmeyin.</p>
              <div className="rounded-xl border border-border bg-bg-surface p-5">
                <h4 className="font-semibold text-white mb-2">Hala sorunuz mu var?</h4>
                <p className="text-sm text-text-muted mb-4">Aradığınız cevabı bulamadıysanız, destek ekibimizle iletişime geçebilirsiniz.</p>
                <Link href="/iletisim" className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dim transition-colors">
                  Destek Ekibine Ulaşın <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-xl border border-border bg-bg-surface overflow-hidden">
                  <button type="button" className="w-full flex items-center justify-between px-5 py-4 text-left" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <h3 className="font-semibold text-white text-sm">{faq.q}</h3>
                    {openFaq === i ? <ChevronUp className="h-4 w-4 text-brand shrink-0" /> : <ChevronDown className="h-4 w-4 text-text-muted shrink-0" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-text-muted leading-relaxed border-t border-border pt-3">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
