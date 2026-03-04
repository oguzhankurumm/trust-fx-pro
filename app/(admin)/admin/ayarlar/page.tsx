import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Ayarlar | Admin" };

const envRows = [
  { key: "DATABASE_URL", desc: "PostgreSQL bağlantı dizesi" },
  { key: "NEXTAUTH_SECRET", desc: "NextAuth JWT şifreleme anahtarı" },
  { key: "NEXTAUTH_URL", desc: "Uygulama kök URL'si" },
  { key: "COINGECKO_API_KEY", desc: "CoinGecko Pro API anahtarı (opsiyonel)" },
  { key: "GOOGLE_CLIENT_ID", desc: "Google OAuth istemci ID'si (opsiyonel)" },
  { key: "GOOGLE_CLIENT_SECRET", desc: "Google OAuth istemci sırrı (opsiyonel)" },
];

export default function AyarlarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Ayarlar</h1>
        <p className="text-text-muted text-sm">Platform yapılandırması ve çevre değişkenleri.</p>
      </div>

      {/* Env Vars Reference */}
      <Card>
        <CardHeader><CardTitle>Çevre Değişkenleri Referansı</CardTitle></CardHeader>
        <CardContent>
          <p className="text-text-muted text-xs mb-4">
            Bu değişkenler sunucu tarafında <code className="font-mono bg-bg-elevated px-1.5 py-0.5 rounded">.env</code> veya
            hosting platformunuzun environment settings ekranında tanımlanmalıdır.
            Değerleri burada görüntüleyemezsiniz — bu bir güvenlik önlemidir.
          </p>
          <div className="space-y-2">
            {envRows.map((r) => (
              <div key={r.key} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div>
                  <code className="font-mono text-sm text-brand">{r.key}</code>
                  <p className="text-text-muted text-xs mt-0.5">{r.desc}</p>
                </div>
                <span className="text-xs text-text-muted bg-bg-elevated px-2 py-1 rounded-lg border border-border">
                  gizli
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits Info */}
      <Card>
        <CardHeader><CardTitle>Hız Sınırları</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {[
              { route: "POST /api/auth/register", limit: "5 / 10 dakika (IP bazlı)" },
              { route: "POST /api/panel/cuzdan/deposit", limit: "10 / dakika (kullanıcı bazlı)" },
              { route: "POST /api/panel/cuzdan/withdraw", limit: "10 / dakika (kullanıcı bazlı)" },
              { route: "POST /api/admin/balance", limit: "10 / dakika (admin bazlı)" },
              { route: "GET /api/crypto/markets", limit: "45 sn önbellek" },
              { route: "GET /api/crypto/coin/[id]", limit: "60 sn önbellek" },
            ].map((r) => (
              <div key={r.route} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <code className="font-mono text-xs text-text-secondary">{r.route}</code>
                <span className="text-text-muted text-xs">{r.limit}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Build Info */}
      <Card>
        <CardHeader><CardTitle>Uygulama Bilgisi</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {[
              { label: "Uygulama", value: "TrustFX Pro" },
              { label: "Framework", value: "Next.js 16 (App Router)" },
              { label: "ORM", value: "Prisma 7" },
              { label: "Auth", value: "NextAuth v5 (Beta)" },
              { label: "UI", value: "Tailwind CSS 4 + CVA" },
              { label: "Veri Kaynağı", value: "CoinGecko API" },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-text-muted">{r.label}</span>
                <span className="text-text-primary font-medium">{r.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
