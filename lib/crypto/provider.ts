import type { CoinMarket, CoinDetail, ChartData } from "@/types";

export interface CryptoProvider {
  /** Paginated coin list with market data */
  getMarkets(params: {
    currency?: string;
    page?: number;
    perPage?: number;
    sparkline?: boolean;
  }): Promise<CoinMarket[]>;

  /** Full coin details */
  getCoin(id: string): Promise<CoinDetail>;

  /** Historical price / volume / market-cap chart */
  getChart(id: string, currency: string, days: number): Promise<ChartData>;
}
