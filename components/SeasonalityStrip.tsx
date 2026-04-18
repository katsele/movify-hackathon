"use client";

const MONTH_LABELS = [
  "J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D",
] as const;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const HIGH_COLOR = "#D97706";
const LOW_COLOR = "#059669";
const NEUTRAL_COLOR = "#A8A39A";
const MIN_HEIGHT_PCT = 12;
const MAX_INDEX_CLAMP = 2;

export interface SeasonalityStripProps {
  seasonalIndex: Record<number, number>;
  weightedMonthly?: Record<number, number>;
  highlightMonth?: number;
}

function colorFor(index: number): string {
  if (index > 1.15) return HIGH_COLOR;
  if (index < 0.85) return LOW_COLOR;
  return NEUTRAL_COLOR;
}

function heightPercent(index: number): number {
  const clamped = Math.min(index, MAX_INDEX_CLAMP);
  const pct = (clamped / MAX_INDEX_CLAMP) * 100;
  return Math.max(pct, MIN_HEIGHT_PCT);
}

export function SeasonalityStrip({
  seasonalIndex,
  weightedMonthly,
  highlightMonth,
}: SeasonalityStripProps) {
  const flat = Object.values(seasonalIndex).every(
    (v) => Math.abs(v - 1) < 0.001,
  );

  return (
    <div>
      <div className="flex items-end gap-1 h-20">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
          const index = seasonalIndex[month] ?? 1;
          const weighted = weightedMonthly?.[month];
          const isHighlight = month === highlightMonth;
          return (
            <div
              key={month}
              className="flex-1 flex flex-col items-center justify-end h-full group relative"
            >
              <div
                className="w-full rounded-sm transition-opacity"
                style={{
                  height: `${heightPercent(index)}%`,
                  backgroundColor: colorFor(index),
                  opacity: isHighlight ? 1 : 0.85,
                  outline: isHighlight ? "2px solid #1A1814" : "none",
                  outlineOffset: "1px",
                }}
                title={`${MONTH_NAMES[month - 1]}: index ${index.toFixed(2)}${
                  weighted !== undefined
                    ? `, weighted starts ${weighted.toFixed(1)}`
                    : ""
                }`}
              />
              <div
                className="absolute -bottom-4 text-[10px] font-mono"
                style={{ color: "#78736A" }}
              >
                {MONTH_LABELS[month - 1]}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Seasonality (last 3y, 2y half-life)</span>
        {flat ? (
          <span>Not enough history — flat prior applied</span>
        ) : (
          <span>
            <span
              className="inline-block w-2 h-2 rounded-sm mr-1"
              style={{ backgroundColor: HIGH_COLOR }}
            />
            busier
            <span
              className="inline-block w-2 h-2 rounded-sm ml-3 mr-1"
              style={{ backgroundColor: LOW_COLOR }}
            />
            quieter
          </span>
        )}
      </div>
    </div>
  );
}
