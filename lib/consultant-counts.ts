export function roundConsultantCount(value: number): number {
  return Math.round(value);
}

export function formatSignedConsultantGap(value: number): string {
  const rounded = roundConsultantCount(value);

  if (rounded > 0) return `+${rounded}`;
  if (rounded < 0) return `${rounded}`;
  return "0";
}
