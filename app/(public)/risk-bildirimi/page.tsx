import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Risk Bildirimi",
};

export default function RiskBildiriminPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Warning banner */}
        <div className="mb-10 rounded-2xl border border-danger/30 bg-danger/5 p-6">
          <p className="text-danger font-bold text-lg mb-2">⚠️ Önemli Uyarı</p>
          <p className="text-text-secondary text-sm leading-relaxed">
            Kripto para yatırımları yüksek risk içerir. Yatırdığınız paranın tamamını kaybedebilirsiniz.
            Bu platform yatırım tavsiyesi vermez; sunulan içerik yalnızca bilgilendirme amaçlıdır.
          </p>
        </div>

        <h1 className="text-3xl font-extrabold text-text-primary mb-2">Risk Bildirimi</h1>
        <p className="text-text-muted text-sm mb-10">Son güncelleme: 1 Ocak 2025</p>

        {[
          {
            title: "1. Piyasa Riski",
            body: "Kripto para fiyatları son derece değişken olup kısa sürede dramatik biçimde yükselip düşebilir. Geçmiş fiyat performansı gelecekteki sonuçların göstergesi değildir.",
          },
          {
            title: "2. Likidite Riski",
            body: "Bazı kripto paralarda düşük işlem hacmi nedeniyle pozisyon açmak ya da kapatmak istenilen fiyattan mümkün olmayabilir.",
          },
          {
            title: "3. Teknolojik Risk",
            body: "Blockchain ağları, akıllı sözleşmeler ve cüzdan yazılımları teknik hatalar, güvenlik açıkları veya ağ kesintilerine maruz kalabilir.",
          },
          {
            title: "4. Düzenleyici Risk",
            body: "Kripto para mevzuatı ülkeden ülkeye değişmekte ve hızla gelişmektedir. Düzenleyici değişiklikler yatırımlarınızın değerini olumsuz etkileyebilir.",
          },
          {
            title: "5. Siber Güvenlik Riski",
            body: "Hesap kimlik bilgilerinizi güvende tutmak sizin sorumluluğunuzdadır. Kimlik avı saldırıları, kötü amaçlı yazılım ve sosyal mühendislik yoluyla varlıklarınız tehlikeye girebilir.",
          },
          {
            title: "6. Karşı Taraf Riski",
            body: "TrustFX Pro bir borsa veya saklama hizmeti değildir. Kullanıcılar kendi varlıklarının sorumluluğunu taşır; üçüncü taraf hizmet sağlayıcılarına ait risklerden platform sorumlu tutulamaz.",
          },
          {
            title: "7. Yatırım Tavsiyesi Değildir",
            body: "Platform üzerindeki hiçbir içerik, analiz veya veri; alım-satım, yatırım veya finansal tavsiye niteliği taşımaz. Kararlarınızı kendi araştırmanıza ve/veya lisanslı bir finansal danışmana dayanarak alınız.",
          },
        ].map((s) => (
          <section key={s.title} className="mb-8">
            <h2 className="text-lg font-bold text-text-primary mb-2">{s.title}</h2>
            <p className="text-text-secondary leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
