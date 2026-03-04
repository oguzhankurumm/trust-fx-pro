import React from "react";
import type { Metadata } from "next";
import { Gift, Zap, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Promosyonlar",
  description: "Size özel hazırladığımız promosyonları ve kampanyaları keşfedin.",
};

const promos = [
  {
    icon: Gift,
    title: "Yeni Üyelere Özel",
    desc: "Hoşgeldin bonusu ve işlem avantajları",
    badge: "YENİ ÜYE",
    color: "text-brand",
    border: "border-brand/20",
    bg: "bg-brand/5",
  },
  {
    icon: Zap,
    title: "İşlem Avantajları",
    desc: "Düşük komisyon ve bonus fırsatları",
    badge: "FIRSAT",
    color: "text-success",
    border: "border-success/20",
    bg: "bg-success/5",
  },
  {
    icon: Star,
    title: "VIP Avantajları",
    desc: "Yüksek hacimli işlemler için özel fırsatlar",
    badge: "VIP",
    color: "text-warning",
    border: "border-warning/20",
    bg: "bg-warning/5",
  },
];

export default function PromosyonlarPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-white mb-2">Promosyonlar</h1>
        <p className="text-text-muted">
          Size özel hazırladığımız promosyonları ve kampanyaları keşfedin.
          Fırsatlardan yararlanmak için hesabınıza giriş yapın.
        </p>
      </div>

      {/* Promo Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {promos.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className={`rounded-xl border ${p.border} ${p.bg} p-6 flex flex-col items-center text-center`}
            >
              <span className={`text-xs font-bold ${p.color} bg-bg-base px-2 py-0.5 rounded-full border ${p.border} mb-4`}>
                {p.badge}
              </span>
              <div className={`h-14 w-14 flex items-center justify-center rounded-full border ${p.border} bg-bg-base mb-4`}>
                <Icon className={`h-7 w-7 ${p.color}`} />
              </div>
              <h3 className="font-bold text-white mb-2">{p.title}</h3>
              <p className="text-sm text-text-muted">{p.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Terms */}
      <div className="rounded-xl border border-border bg-bg-surface p-6">
        <h2 className="text-lg font-bold text-white mb-4">Promosyon Şartları</h2>
        <ul className="space-y-2 text-sm text-text-muted list-disc list-inside">
          <li>Promosyonlar yalnızca belirtilen tarih aralığında geçerlidir.</li>
          <li>Bazı promosyonlar sadece yeni üyeler için geçerli olabilir.</li>
          <li>Promosyonlardan yararlanmak için hesabınıza giriş yapmanız gerekebilir.</li>
          <li>Aynı anda birden fazla promosyondan yararlanılmayabilir.</li>
          <li>TrustFX Pro promosyon şartlarında değişiklik yapma hakkını saklı tutar.</li>
        </ul>
      </div>
    </div>
  );
}
