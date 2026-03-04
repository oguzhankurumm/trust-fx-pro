"use client";

import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface PriceChartProps {
  data: number[][];
  positive: boolean;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

function formatPrice(v: number) {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  return `$${v.toFixed(6)}`;
}

export function PriceChart({ data, positive }: PriceChartProps) {
  const color = positive ? "#00E5A0" : "#FF4D6A";
  const chartData = data.map(([ts, price]) => ({ date: ts, price }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1A2E4A" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fill: "#5A7A9A", fontSize: 10 }}
          axisLine={{ stroke: "#1A2E4A" }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={formatPrice}
          tick={{ fill: "#5A7A9A", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={60}
          domain={["auto", "auto"]}
        />
        <Tooltip
          contentStyle={{
            background: "#081428",
            border: "1px solid #1A2E4A",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(v) => formatDate(v as number)}
          formatter={(v: number | undefined) => [v != null ? formatPrice(v) : "", "Fiyat"] as [string, string]}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={2}
          fill="url(#priceGradient)"
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
