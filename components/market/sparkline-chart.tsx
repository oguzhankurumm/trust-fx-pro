"use client";

import React from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SparklineChartProps {
  data: number[];
  positive: boolean;
  width?: number;
  height?: number;
}

export function SparklineChart({ data, positive, width = 80, height = 32 }: SparklineChartProps) {
  const chartData = data.map((value, i) => ({ i, value }));
  const color = positive ? "#00E5A0" : "#FF4D6A";

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
