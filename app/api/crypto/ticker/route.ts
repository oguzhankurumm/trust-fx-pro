import { NextRequest, NextResponse } from "next/server";
import { cache } from "@/lib/cache";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const CACHE_TTL = 30; // 30 seconds — CoinGecko rate limits are stricter than Binance

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

// Maps coin symbol to CoinGecko ID
const SYMBOL_TO_ID: Record<string, string> = {
  BTC:  "bitcoin",
  ETH:  "ethereum",
  BNB:  "binancecoin",
  LTC:  "litecoin",
  DOT:  "polkadot",
  AVAX: "avalanche-2",
  NEAR: "near",
  SOL:  "solana",
  XRP:  "ripple",
  ADA:  "cardano",
};

interface CoinGeckoMarket {
  id: string;
  symbol: string;
  current_price: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  total_volume: number;
}

function buildCgUrl(ids: string[]): string {
  const base = process.env.COINGECKO_API_KEY && process.env.COINGECKO_API_TYPE === "pro"
    ? "https://pro-api.coingecko.com/api/v3"
    : "https://api.coingecko.com/api/v3";

  const url = new URL(`${base}/coins/markets`);
  url.searchParams.set("vs_currency", "try");
  url.searchParams.set("ids", ids.join(","));
  url.searchParams.set("order", "market_cap_desc");
  url.searchParams.set("per_page", String(ids.length));
  url.searchParams.set("page", "1");
  url.searchParams.set("sparkline", "false");
  url.searchParams.set("price_change_percentage", "24h");

  const apiKey = process.env.COINGECKO_API_KEY;
  if (apiKey) {
    if (process.env.COINGECKO_API_TYPE === "pro") {
      // Pro key goes in header, handled below
    } else {
      url.searchParams.set("x_cg_demo_api_key", apiKey);
    }
  }

  return url.toString();
}

// Reverse lookup: CoinGecko ID → symbol
const ID_TO_SYMBOL: Record<string, string> = Object.fromEntries(
  Object.entries(SYMBOL_TO_ID).map(([sym, id]) => [id, sym])
);

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
  const rawSymbols = searchParams.get("symbols") ?? "BTC,ETH,BNB,LTC,DOT,AVAX,NEAR";
  const requested = rawSymbols.split(",").map((s) => s.trim().toUpperCase());

  const validSymbols = requested.filter((s) => SYMBOL_TO_ID[s]);
  if (validSymbols.length === 0) {
    return NextResponse.json({ success: false, error: "Geçersiz sembol(ler)." }, { status: 400 });
  }

  const coinIds = validSymbols.map((s) => SYMBOL_TO_ID[s]);
  const cacheKey = `ticker:cg:${[...validSymbols].sort().join(",")}`;
  const cached = cache.get<TickerData[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, data: cached, cached: true });
  }

  try {
    const url = buildCgUrl(coinIds);
    const headers: HeadersInit = { Accept: "application/json" };
    if (process.env.COINGECKO_API_KEY && process.env.COINGECKO_API_TYPE === "pro") {
      headers["x-cg-pro-api-key"] = process.env.COINGECKO_API_KEY;
    }

    const res = await fetch(url, { headers, cache: "no-store" });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`CoinGecko API hatası: ${res.status} — ${text.slice(0, 120)}`);
    }

    const markets = (await res.json()) as CoinGeckoMarket[];

    const data: TickerData[] = markets.map((m) => {
      const symbol = (ID_TO_SYMBOL[m.id] ?? m.symbol.toUpperCase()) + "TRY";
      const last = m.current_price ?? 0;
      const change = m.price_change_24h ?? 0;
      const open = last - change;
      return {
        symbol,
        lastPrice: last,
        openPrice: open,
        highPrice: m.high_24h ?? last,
        lowPrice: m.low_24h ?? last,
        priceChange: change,
        priceChangePercent: m.price_change_percentage_24h ?? 0,
        volume: m.total_volume ?? 0,
        quoteVolume: 0,
      };
    });

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
