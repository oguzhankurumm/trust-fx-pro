import type { Metadata } from "next";
import { Shield, Zap, Users, TrendingUp, Lock, HeadphonesIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Hakkımızda | TrustFX Pro",
  description: "TrustFX Pro hakkında bilgi edinin. Misyonumuz, vizyonumuz ve değerlerimiz.",
};

const stats = [
  { label: "Aktif Kullanıcı", value: "50.000+" },
  { label: "Günlük İşlem Hacmi", value: "₺500M+" },
  { label: "Desteklenen Coin", value: "200+" },
  { label: "Kuruluş Yılı", value: "2021" },
];

const values = [
  {
    icon: Shield,
    title: "Güvenlik",
    desc: "Kullanıcı varlıklarını korumak için en üst düzey güvenlik protokolleri ve şifreleme teknolojisi kullanıyoruz.",
  },
  {
    icon: Zap,
    title: "Yenilikçilik",
    desc: "Sürekli gelişen teknoloji ile platformumuzu en güncel özelliklerle donatıyoruz.",
  },
  {
    icon: Users,
    title: "Müşteri Odaklılık",
    desc: "Her kararımızda kullanıcı deneyimini ve memnuniyetini ön planda tutuyoruz.",
  },
];

const features = [
  {
    icon: Lock,
    title: "Güvenli Altyapı",
    desc: "SSL şifreleme, 2FA ve soğuk cüzdan sistemi ile varlıklarınız güvende.",
  },
  {
    icon: TrendingUp,
    title: "Düşük Komisyon",
    desc: "Maker ve Taker işlemlerinde yalnızca %0.1 komisyon uyguluyoruz.",
  },
  {
    icon: Zap,
    title: "Hızlı İşlemler",
    desc: "Gelişmiş altyapımız ile saniyeler içinde işlem gerçekleştirin.",
  },
  {
    icon: HeadphonesIcon,
    title: "7/24 Destek",
    desc: "Canlı destek ekibimiz günün her saati yanınızda.",
  },
  {
    icon: Users,
    title: "Geniş Topluluk",
    desc: "50.000+ kullanıcı ile büyüyen bir kripto topluluğunun parçası olun.",
  },
  {
    icon: Shield,
    title: "Lisanslı Platform",
    desc: "Tüm yasal düzenlemelere uygun, denetlenen ve lisanslı bir platform.",
  },
];

export default function HakkimizdaPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand/10 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-text-primary mb-6">
            Kripto Dünyasında{" "}
            <span className="text-brand">Güvenilir Adres</span>
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            TrustFX Pro, Türkiye&apos;nin önde gelen kripto para alım satım platformu olarak
            2021&apos;den beri yatırımcılara güvenli ve hızlı bir işlem ortamı sunmaktadır.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold text-brand">{s.value}</p>
                <p className="text-text-muted text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-border bg-bg-surface p-8">
              <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-brand" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-4">Misyonumuz</h2>
              <p className="text-text-secondary leading-relaxed">
                Kripto para yatırımlarını herkes için erişilebilir, güvenli ve şeffaf hale
                getirmek. Kullanıcılarımızın finansal hedeflerine ulaşmalarına yardımcı olmak
                için en iyi araçları ve hizmetleri sunuyoruz.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-bg-surface p-8">
              <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-brand" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-4">Vizyonumuz</h2>
              <p className="text-text-secondary leading-relaxed">
                Türkiye&apos;nin en büyük ve en güvenilir kripto para borsası olmak.
                Teknoloji ve inovasyonu ön planda tutarak küresel ölçekte rekabetçi bir
                platform sunmayı hedefliyoruz.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-bg-surface">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-4">Değerlerimiz</h2>
          <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
            TrustFX Pro olarak her kararımızda bu temel değerlere bağlı kalıyoruz.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="rounded-2xl border border-border bg-bg-elevated p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-5">
                    <Icon className="h-7 w-7 text-brand" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-3">{v.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Neden Biz */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-4">Neden TrustFX Pro?</h2>
          <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
            Binlerce kullanıcının bizi tercih etmesinin 6 temel nedeni.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex gap-4 rounded-xl border border-border bg-bg-surface p-5">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary mb-1">{f.title}</h3>
                    <p className="text-text-muted text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-bg-surface">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Hemen Başlayın
          </h2>
          <p className="text-text-secondary mb-8 max-w-xl mx-auto">
            50.000+ kullanıcıya katılın ve kripto para yatırımlarınızı güvenle yönetin.
          </p>
          <a
            href="/kayit"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dim transition-colors"
          >
            Ücretsiz Hesap Oluştur →
          </a>
        </div>
      </section>
    </div>
  );
}
