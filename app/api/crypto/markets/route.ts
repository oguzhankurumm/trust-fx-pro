import { NextRequest, NextResponse } from "next/server";
import { cryptoProvider } from "@/lib/crypto/coingecko";
import { cache } from "@/lib/cache";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const CACHE_TTL = 45; // seconds

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(`crypto:markets:${ip}`, 30, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Çok fazla istek. Lütfen bir dakika bekleyin." },
      { status: 429 }
    );
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const perPage = Math.min(250, Math.max(1, parseInt(searchParams.get("per_page") ?? "100", 10)));
  const currency = searchParams.get("currency") ?? "usd";

  const cacheKey = `markets:${currency}:${page}:${perPage}`;
  const cached = cache.get<{ data: unknown; total: number; cached_at: string }>(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, ...cached });
  }

  try {
    const data = await cryptoProvider.getMarkets({ currency, page, perPage, sparkline: true });

    const payload = {
      data,
      total: data.length,
      cached_at: new Date().toISOString(),
    };

    cache.set(cacheKey, payload, CACHE_TTL);

    return NextResponse.json({ success: true, ...payload });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    return NextResponse.json(
      { success: false, error: `Piyasa verisi alınamadı: ${message}` },
      { status: 503 }
    );
  }
}
