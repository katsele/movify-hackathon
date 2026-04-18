/**
 * Display helper: integers for |v| ≥ 1 (whole consultants), one decimal for |v| < 1
 * so sub-unit gaps are not misread as 0 or 1.
 */
export function roundConsultantCount(value: number): number {
  const abs = Math.abs(value);
  if (abs >= 1) return Math.round(value);
  return Math.round(value * 10) / 10;
}

export function formatSignedConsultantGap(value: number): string {
  const rounded = roundConsultantCount(value);

  if (rounded > 0) return `+${rounded}`;
  if (rounded < 0) return `${rounded}`;
  return "0";
}
