"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface SignalWeightDatum {
  source: string;
  weight: number;
  color: string;
}

interface SignalWeightChartProps {
  data: SignalWeightDatum[];
  height?: number;
}

export function SignalWeightChart({
  data,
  height = 180,
}: SignalWeightChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
      >
        <XAxis
          type="number"
          domain={[0, 1]}
          tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`}
          tick={{
            fontSize: 11,
            fill: "#78736A",
            fontFamily: "var(--font-mono)",
          }}
        />
        <YAxis
          type="category"
          dataKey="source"
          width={120}
          tick={{ fontSize: 12, fill: "#27251F" }}
        />
        <Tooltip
          formatter={(v: number) => `${Math.round(v * 100)}%`}
          contentStyle={{
            fontSize: 12,
            borderRadius: 6,
            border: "1px solid #E7E5E1",
            backgroundColor: "#1A1814",
            color: "#F4F3F1",
          }}
          labelStyle={{ color: "#F4F3F1" }}
          itemStyle={{ color: "#F4F3F1" }}
        />
        <Bar dataKey="weight" radius={[0, 4, 4, 0]}>
          {data.map((d) => (
            <Cell key={d.source} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
