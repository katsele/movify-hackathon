"use client";

import { roundConsultantCount } from "@/lib/consultant-counts";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface DemandCurvePoint {
  month: string;
  demand: number;
  supply: number;
  confidenceLow: number;
  confidenceHigh: number;
}

interface DemandCurveProps {
  data: DemandCurvePoint[];
  height?: number;
}

export function DemandCurve({ data, height = 260 }: DemandCurveProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="demandFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DC2626" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E1" />
        <XAxis
          dataKey="month"
          tick={{
            fontSize: 11,
            fill: "#78736A",
            fontFamily: "var(--font-mono)",
          }}
        />
        <YAxis
          allowDecimals={false}
          tickFormatter={(value) => `${roundConsultantCount(Number(value))}`}
          tick={{
            fontSize: 11,
            fill: "#78736A",
            fontFamily: "var(--font-mono)",
          }}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 6,
            border: "1px solid #E7E5E1",
            backgroundColor: "#1A1814",
            color: "#F4F3F1",
          }}
          labelStyle={{ color: "#F4F3F1" }}
          itemStyle={{ color: "#F4F3F1" }}
          formatter={(value: number) => `${roundConsultantCount(value)}`}
        />
        <Legend
          iconType="line"
          wrapperStyle={{ fontSize: 12, color: "#3D3A33" }}
        />
        <Area
          type="monotone"
          dataKey="confidenceHigh"
          stroke="none"
          fill="url(#demandFill)"
          stackId="confidence"
          legendType="none"
        />
        <Area
          type="monotone"
          dataKey="confidenceLow"
          stroke="none"
          fill="#FAFAF9"
          stackId="confidence"
          legendType="none"
        />
        <Line
          type="monotone"
          dataKey="demand"
          stroke="#DC2626"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Predicted demand"
        />
        <Line
          type="monotone"
          dataKey="supply"
          stroke="#059669"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Current supply"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
