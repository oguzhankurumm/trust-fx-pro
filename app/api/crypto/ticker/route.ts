import { NextRequest, NextResponse } from "next/server";
import { cache } from "@/lib/cache";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const BINANCE_BASE = "https://api.binance.com/api/v3";
const CACHE_TTL = 5; // 5 seconds — real-time data

export interface TickerData {
  symbol: string;
  lastPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  quoteVolume: number;
}

// Maps our coin symbols to Binance TRY pair symbols
const SYMBOL_MAP: Record<string, string> = {
  BTC:  "BTCTRY",
  ETH:  "ETHTRY",
  BNB:  "BNBTRY",
  LTC:  "LTCTRY",
  DOT:  "DOTTRY",
  AVAX: "AVAXTRY",
  NEAR: "NEARTRY",
  SOL:  "SOLTRY",
  XRP:  "XRPTRY",
  ADA:  "ADATRY",
};

function parseTicker(raw: {
  symbol: string;
  lastPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
}): TickerData {
  const last = parseFloat(raw.lastPrice);
  const open = parseFloat(raw.openPrice);
  return {
    symbol: raw.symbol,
    lastPrice: last,
    openPrice: open,
    highPrice: parseFloat(raw.highPrice),
    lowPrice: parseFloat(raw.lowPrice),
    priceChange: last - open,
    priceChangePercent: open > 0 ? ((last - open) / open) * 100 : 0,
    volume: parseFloat(raw.volume),
    quoteVolume: parseFloat(raw.quoteVolume),
  };
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(`crypto:ticker:${ip}`, 60, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Çok fazla istek." },
      { status: 429 }
    );
  }

  const { searchParams } = req.nextUrl;
  // Accept comma-separated symbols like ?symbols=BTC,ETH,BNB
  const rawSymbols = searchParams.get("symbols") ?? "BTC,ETH,BNB,LTC,DOT,AVAX,NEAR";
  const requested = rawSymbols.split(",").map((s) => s.trim().toUpperCase());

  // Map to Binance symbols, skip unknowns
  const binanceSymbols = requested
    .map((s) => SYMBOL_MAP[s])
    .filter(Boolean) as string[];

  if (binanceSymbols.length === 0) {
    return NextResponse.json({ success: false, error: "Geçersiz sembol(ler)." }, { status: 400 });
  }

  const cacheKey = `ticker:${binanceSymbols.sort().join(",")}`;
  const cached = cache.get<TickerData[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, data: cached, cached: true });
  }

  try {
    const encoded = encodeURIComponent(JSON.stringify(binanceSymbols));
    const res = await fetch(
      `${BINANCE_BASE}/ticker/24hr?symbols=${encoded}&type=MINI`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Binance API hatası: ${res.status} — ${text.slice(0, 100)}`);
    }

    const rawList = await res.json() as Array<{
      symbol: string;
      openPrice: string;
      highPrice: string;
      lowPrice: string;
      lastPrice: string;
      volume: string;
      quoteVolume: string;
    }>;

    const data = rawList.map(parseTicker);
    cache.set(cacheKey, data, CACHE_TTL);

    return NextResponse.json({ success: true, data, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    console.error("[ticker]", message);
    return NextResponse.json(
      { success: false, error: `Fiyat verisi alınamadı: ${message}` },
      { status: 503 }
    );
  }
}
