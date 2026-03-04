import type { CryptoProvider } from "./provider";
import type { CoinMarket, CoinDetail, ChartData } from "@/types";

const FREE_BASE = "https://api.coingecko.com/api/v3";
const PRO_BASE = "https://pro-api.coingecko.com/api/v3";
const API_TYPE = process.env.COINGECKO_API_TYPE ?? "demo";

function getBaseUrl(): string {
  if (process.env.COINGECKO_API_KEY && API_TYPE === "pro") return PRO_BASE;
  return FREE_BASE;
}

async function cgFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${getBaseUrl()}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: HeadersInit = { Accept: "application/json" };
  const apiKey = process.env.COINGECKO_API_KEY;
  if (apiKey) {
    if (API_TYPE === "pro") {
      headers["x-cg-pro-api-key"] = apiKey;
    } else {
      // Demo API key — passed as query param
      url.searchParams.set("x_cg_demo_api_key", apiKey);
    }
  }

  const res = await fetch(url.toString(), {
    headers,
    // Let server-side MemoryCache in lib/cache.ts handle caching;
    // avoid conflicting with Next.js Data Cache in API routes.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`CoinGecko API hatası: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export class CoinGeckoProvider implements CryptoProvider {
  async getMarkets({
    currency = "usd",
    page = 1,
    perPage = 100,
    sparkline = true,
  } = {}): Promise<CoinMarket[]> {
    return cgFetch<CoinMarket[]>("/coins/markets", {
      vs_currency: currency,
      order: "market_cap_desc",
      per_page: String(perPage),
      page: String(page),
      sparkline: String(sparkline),
      price_change_percentage: "24h",
      locale: "tr",
    });
  }

  async getCoin(id: string): Promise<CoinDetail> {
    return cgFetch<CoinDetail>(`/coins/${encodeURIComponent(id)}`, {
      localization: "true",
      tickers: "false",
      market_data: "true",
      community_data: "false",
      developer_data: "false",
    });
  }

  async getChart(id: string, currency = "usd", days = 7): Promise<ChartData> {
    return cgFetch<ChartData>(`/coins/${encodeURIComponent(id)}/market_chart`, {
      vs_currency: currency,
      days: String(days),
    });
  }
}

// Singleton provider — swap implementation by changing this export
export const cryptoProvider: CryptoProvider = new CoinGeckoProvider();
