const SUB_UNIT_THRESHOLD = 1;

export function roundConsultantCount(value: number): number {
  if (Math.abs(value) < SUB_UNIT_THRESHOLD) {
    return Math.round(value * 10) / 10;
  }
  return Math.round(value);
}

export function formatConsultantCount(value: number): string {
  const rounded = roundConsultantCount(value);
  if (Math.abs(rounded) < SUB_UNIT_THRESHOLD) {
    return rounded.toFixed(1);
  }
  return `${rounded}`;
}

export function formatSignedConsultantGap(value: number): string {
  const rounded = roundConsultantCount(value);

  if (rounded === 0) return "0";

  const formatted =
    Math.abs(rounded) < SUB_UNIT_THRESHOLD ? rounded.toFixed(1) : `${rounded}`;
  return rounded > 0 ? `+${formatted}` : formatted;
}
