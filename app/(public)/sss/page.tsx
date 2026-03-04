"use client";

import { useState } from "react";

export const dynamic = "force-static";

const faqs = [
  {
    cat: "Genel",
    items: [
      {
        q: "TrustFX Pro nedir?",
        a: "TrustFX Pro, 1.700'den fazla kripto parayı gerçek zamanlı takip etmenizi, fiyat grafiklerini incelemenizi ve güvenli ön-rezervasyon işlemleri yapmanızı sağlayan bir platformdur.",
      },
      {
        q: "Platform Türkçe mi?",
        a: "Evet. Arayüz, destek ve tüm içerik Türkçe olarak sunulmaktadır.",
      },
      {
        q: "Mobilde kullanabilir miyim?",
        a: "Evet. Platform mobile-first tasarıma sahiptir; her cihazda sorunsuz çalışır.",
      },
    ],
  },
  {
    cat: "Hesap & Güvenlik",
    items: [
      {
        q: "Üyelik ücretsiz mi?",
        a: "Temel üyelik ücretsizdir. Gelişmiş özellikler ve daha yüksek işlem limitleri için premium üyelik planlarımıza göz atabilirsiniz.",
      },
      {
        q: "Şifremi unutursam ne yapmalıyım?",
        a: "Giriş ekranındaki 'Şifremi Unuttum' bağlantısına tıklayarak e-posta adresinize sıfırlama bağlantısı gönderebilirsiniz.",
      },
      {
        q: "İki faktörlü doğrulama (2FA) destekleniyor mu?",
        a: "Evet, Google Authenticator ve SMS tabanlı 2FA desteklenmektedir. Hesap güvenliğinizi artırmak için 2FA'yı etkinleştirmenizi öneriyoruz.",
      },
    ],
  },
  {
    cat: "Yatırım & Çekim",
    items: [
      {
        q: "Minimum yatırım miktarı nedir?",
        a: "Minimum yatırım miktarı 100 TRY veya 10 USDT'dir.",
      },
      {
        q: "Çekim işlemleri ne kadar sürer?",
        a: "Onaylanan çekim talepleri genellikle 1-3 iş günü içinde gerçekleştirilir.",
      },
      {
        q: "İşlem ücretleri nedir?",
        a: "Yatırım işlemlerinde komisyon alınmaz. Çekim işlemlerinde kullanılan ağa bağlı olarak ağ ücreti uygulanır.",
      },
    ],
  },
  {
    cat: "Teknik",
    items: [
      {
        q: "Fiyat verileri hangi kaynaktan geliyor?",
        a: "CoinGecko API üzerinden anlık piyasa verileri çekilmektedir. Veriler 45 saniyede bir güncellenir.",
      },
      {
        q: "API erişimi var mı?",
        a: "Premium üyelere programatik API erişimi sunulmaktadır. Detaylar için destek ekibimizle iletişime geçin.",
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        className="w-full py-4 flex items-center justify-between text-left gap-4 text-text-primary hover:text-brand transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium">{q}</span>
        <span className="text-xl shrink-0">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="pb-4 text-text-secondary text-sm leading-relaxed">{a}</p>}
    </div>
  );
}

export default function SSSPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-text-primary mb-4">
            Sıkça Sorulan <span className="gradient-text">Sorular</span>
          </h1>
          <p className="text-text-secondary">
            Aradığınız cevabı bulamıyor musunuz?{" "}
            <a href="/iletisim" className="text-brand hover:underline">
              Bize ulaşın
            </a>
            .
          </p>
        </div>

        <div className="space-y-8">
          {faqs.map((cat) => (
            <div key={cat.cat} className="glass-card rounded-2xl px-6">
              <h2 className="text-brand font-semibold text-sm uppercase tracking-wider pt-6 pb-2">
                {cat.cat}
              </h2>
              {cat.items.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
