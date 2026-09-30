export type Bin = { lower: number; upper: number; count: number };

export function histogram(values: number[], binCount = 6): Bin[] {
  if (!values.length) return [];
  const min = Math.min(...values), max = Math.max(...values);
  if (min === max) return [{ lower: min, upper: max, count: values.length }];
  const bins = Array.from({ length: binCount }, (_, i) => ({
    lower: min + (max - min) * i / binCount,
    upper: i === binCount - 1 ? max : min + (max - min) * (i + 1) / binCount,
    count: 0,
  }));
  for (const value of values) {
    bins[Math.min(binCount - 1, Math.floor((value - min) / (max - min) * binCount))].count++;
  }
  return bins;
}
