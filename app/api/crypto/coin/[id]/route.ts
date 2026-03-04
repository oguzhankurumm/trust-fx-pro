import { NextRequest, NextResponse } from "next/server";
import { cryptoProvider } from "@/lib/crypto/coingecko";
import { cache } from "@/lib/cache";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const CACHE_TTL = 60; // seconds

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ip = getClientIp(req);
  const { allowed } = rateLimit(`crypto:coin:${ip}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Çok fazla istek. Lütfen bir dakika bekleyin." },
      { status: 429 }
    );
  }

  const cacheKey = `coin:${id}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, ...cached });
  }

  try {
    const [coin, chart_7d, chart_30d] = await Promise.all([
      cryptoProvider.getCoin(id),
      cryptoProvider.getChart(id, "usd", 7),
      cryptoProvider.getChart(id, "usd", 30),
    ]);

    const payload = { coin, chart_7d, chart_30d, cached_at: new Date().toISOString() };
    cache.set(cacheKey, payload, CACHE_TTL);

    return NextResponse.json({ success: true, ...payload });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    return NextResponse.json(
      { success: false, error: `Coin verisi alınamadı: ${message}` },
      { status: 503 }
    );
  }
}
