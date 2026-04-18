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
  historicalMin?: number;
  historicalMax?: number;
}

interface DemandCurveProps {
  data: DemandCurvePoint[];
  height?: number;
  showHistoricalBand?: boolean;
}

export function DemandCurve({
  data,
  height = 260,
  showHistoricalBand = false,
}: DemandCurveProps) {
  const hasHistorical =
    showHistoricalBand &&
    data.some(
      (point) =>
        point.historicalMax !== undefined && point.historicalMax > 0,
    );

  const normalised = hasHistorical
    ? data.map((point) => ({
        ...point,
        historicalMin: point.historicalMin ?? 0,
        historicalSpread:
          (point.historicalMax ?? 0) - (point.historicalMin ?? 0),
      }))
    : data;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={normalised}
        margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
      >
        <defs>
          <linearGradient id="demandFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DC2626" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="historicalFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A8A39A" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#A8A39A" stopOpacity={0.15} />
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
        {hasHistorical ? (
          <>
            <Area
              type="monotone"
              dataKey="historicalMin"
              stroke="none"
              fill="transparent"
              stackId="historical"
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="historicalSpread"
              stroke="#A8A39A"
              strokeDasharray="3 3"
              strokeOpacity={0.6}
              fill="url(#historicalFill)"
              stackId="historical"
              name="Historical range (last 3y)"
            />
          </>
        ) : null}
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
