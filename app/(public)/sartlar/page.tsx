import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Şartlar ve Koşullar | TrustFX Pro",
};

export default function SartlarPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-3xl prose-trustfx">
        <h1 className="text-3xl font-extrabold text-text-primary mb-2">Şartlar ve Koşullar</h1>
        <p className="text-text-muted text-sm mb-10">Son güncelleme: 1 Ocak 2025</p>

        {[
          {
            title: "1. Hizmetin Kapsamı",
            body: "TrustFX Pro, kripto para piyasa verilerini takip etmek ve ön-rezervasyon işlemleri gerçekleştirmek için bir dijital platform sunar. Platform, herhangi bir kripto para borsası veya yatırım aracısı değildir.",
          },
          {
            title: "2. Kullanım Koşulları",
            body: "Platforma kaydolarak bu şartları kabul etmiş sayılırsınız. Platform yalnızca 18 yaş ve üzeri kişiler tarafından kullanılabilir. Hesabınızın güvenliğinden tamamen siz sorumlusunuz.",
          },
          {
            title: "3. Ücretler ve Ödemeler",
            body: "Temel piyasa takip hizmetleri ücretsizdir. Ön-rezervasyon işlemleri ve premium özellikler için ilgili sayfada belirtilen ücretler geçerlidir. Ücretler önceden bildirim yapılmaksızın değiştirilebilir.",
          },
          {
            title: "4. Gizlilik",
            body: "Kişisel verileriniz Gizlilik Politikamız kapsamında işlenir. Verileriniz üçüncü taraflarla yalnızca açık rızanız veya yasal yükümlülük dahilinde paylaşılır.",
          },
          {
            title: "5. Sorumluluk Reddi",
            body: "Platform, sağlanan piyasa verilerinin doğruluğunu veya eksiksizliğini garanti etmez. Kullanıcıların finansal kararlarından doğan kayıplardan TrustFX Pro sorumlu tutulamaz.",
          },
          {
            title: "6. Hesap Askıya Alma",
            body: "Şartları ihlal eden, platformu kötüye kullanan veya güvenliği tehdit eden kullanıcıların hesapları bildirim yapılmaksızın askıya alınabilir veya silinebilir.",
          },
          {
            title: "7. Değişiklikler",
            body: "Bu şartları dilediğimiz zaman güncelleyebiliriz. Güncellemeler platform üzerinden duyurulacak; platformu kullanmaya devam etmeniz güncel şartları kabul ettiğiniz anlamına gelir.",
          },
          {
            title: "8. Uygulanacak Hukuk",
            body: "Bu şartlar Türk Hukuku'na tabidir. Uyuşmazlıkların çözümünde İstanbul Mahkemeleri yetkilidir.",
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
