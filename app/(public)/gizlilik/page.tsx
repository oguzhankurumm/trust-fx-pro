import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | TrustFX Pro",
};

export default function GizlilikPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl font-extrabold text-text-primary mb-2">Gizlilik Politikası</h1>
        <p className="text-text-muted text-sm mb-10">Son güncelleme: 1 Ocak 2025</p>

        {[
          {
            title: "1. Topladığımız Veriler",
            body: "Kayıt sırasında ad, e-posta ve şifrenizi (hashlenmiş olarak) saklarız. Platform kullanımınızdan anonim kullanım analitikleri toplanabilir.",
          },
          {
            title: "2. Verilerin Kullanımı",
            body: "Verileriniz; hesabınızı yönetmek, işlemlerinizi işlemek, destek sağlamak ve yasal yükümlülükleri yerine getirmek amacıyla kullanılır.",
          },
          {
            title: "3. Verilerin Paylaşımı",
            body: "Kişisel verileriniz; açık rızanız olmaksızın, zorunlu hizmet sağlayıcılar (ödeme işlemcisi, hosting) ve yasal yükümlülükler dışında üçüncü kişilerle paylaşılmaz.",
          },
          {
            title: "4. Çerezler",
            body: "Platform, oturumu yönetmek ve kullanıcı tercihlerini hatırlamak için teknik çerezler kullanır. Reklam amaçlı çerez kullanılmaz.",
          },
          {
            title: "5. Veri Güvenliği",
            body: "Verileriniz şifreli bağlantılar (HTTPS) ve güvenli veri tabanı sunucuları üzerinde saklanır. Düzenli güvenlik denetimleri yapılır.",
          },
          {
            title: "6. Haklarınız",
            body: "KVKK kapsamında; verilerinize erişme, düzeltime, silme ve işlemeye itiraz etme haklarına sahipsiniz. Taleplerinizi destek@trustfxpro.com.tr adresine iletebilirsiniz.",
          },
          {
            title: "7. Saklama Süresi",
            body: "Hesap verileri, hesabınız aktif olduğu sürece saklanır. Hesap silme talebinden sonra veriler 30 gün içinde imha edilir; yasal yükümlülük gerektiren veriler mevzuatta öngörülen süre boyunca tutulur.",
          },
          {
            title: "8. İletişim",
            body: "Gizlilik konusundaki sorularınız için destek@trustfxpro.com.tr adresine yazabilirsiniz.",
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
