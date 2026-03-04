import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import { LiveSupport } from "@/components/ui/live-support";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://trustfxpro.com.tr"),
  title: {
    default: "TrustFX Pro — Kripto Para Platformu",
    template: "%s | TrustFX Pro",
  },
  description:
    "TrustFX Pro ile kripto para alım satımı yapın, anlık piyasa verilerini takip edin ve güvenli dijital varlık yönetimi sağlayın. Türkiye&apos;nin güvenilir kripto platformu.",
  keywords: ["kripto para", "bitcoin", "ethereum", "piyasa", "trading", "TrustFX Pro", "kripto trading", "BTC", "ETH"],
  authors: [{ name: "TrustFX Pro", url: "https://trustfxpro.com.tr" }],
  creator: "TrustFX Pro",
  publisher: "TrustFX Pro",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://trustfxpro.com.tr",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://trustfxpro.com.tr",
    siteName: "TrustFX Pro",
    title: "TrustFX Pro — Kripto Para Platformu",
    description: "TrustFX Pro ile kripto para alım satımı yapın ve piyasayı takip edin.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrustFX Pro — Kripto Para Platformu",
    description: "TrustFX Pro ile kripto para alım satımı yapın ve piyasayı takip edin.",
    creator: "@trustfxpro",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <Toaster>
            {children}
          </Toaster>
          <LiveSupport />
        </Providers>
      </body>
    </html>
  );
}
