"use client";

import React, { useState } from "react";
import { PriceChart } from "./price-chart";
import { Card } from "@/components/ui/card";
import type { CoinDetail, ChartData } from "@/types";

interface CoinDetailClientProps {
  coin: CoinDetail;
  chart7d: ChartData;
  chart30d: ChartData;
  isPositive: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CoinDetailClient({ coin, chart7d, chart30d, isPositive }: CoinDetailClientProps) {
  const [period, setPeriod] = useState<"7d" | "30d">("7d");
  const chartData = period === "7d" ? chart7d.prices : chart30d.prices;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary">Fiyat Grafiği</h2>
        <div className="flex rounded-lg overflow-hidden border border-border">
          {(["7d", "30d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p
                  ? "bg-brand/10 text-brand"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {p === "7d" ? "7 Gün" : "30 Gün"}
            </button>
          ))}
        </div>
      </div>
      <PriceChart data={chartData} positive={isPositive} />
    </Card>
  );
}
