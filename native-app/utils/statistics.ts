export interface StatsSummary {
  n: number;
  values: number[]; // raw values, original entry order
  sortedIndices: number[]; // index into `values`, sorted by value (stable)
  mean: number;
  median: number;
  medianValueIndices: number[]; // index/indices into `values` that define the median
  modes: number[]; // empty when there is no mode
  min: number;
  max: number;
  q1: number;
  q3: number;
}

/** Parses a comma-separated string into finite numbers, ignoring blank/invalid tokens. */
export function parseNumberList(text: string): number[] {
  return text
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
    .map((token) => Number(token))
    .filter((value) => Number.isFinite(value));
}

function medianOfSorted(values: number[]): number {
  const n = values.length;
  const mid = Math.floor(n / 2);
  return n % 2 === 1 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}

/** Computes mean/median/mode/quartiles. Returns null when there's no data. */
export function computeStats(values: number[]): StatsSummary | null {
  const n = values.length;
  if (n === 0) return null;

  const indexed = values.map((value, index) => ({ value, index }));
  indexed.sort((a, b) => a.value - b.value || a.index - b.index);
  const sortedValues = indexed.map((item) => item.value);
  const sortedIndices = indexed.map((item) => item.index);

  const mean = values.reduce((sum, value) => sum + value, 0) / n;

  let medianSortedPositions: number[];
  if (n % 2 === 1) {
    medianSortedPositions = [(n - 1) / 2];
  } else {
    medianSortedPositions = [n / 2 - 1, n / 2];
  }
  const median = medianOfSorted(sortedValues);
  const medianValueIndices = medianSortedPositions.map((pos) => sortedIndices[pos]);

  const lowerHalf = n % 2 === 0 ? sortedValues.slice(0, n / 2) : sortedValues.slice(0, (n - 1) / 2);
  const upperHalf = n % 2 === 0 ? sortedValues.slice(n / 2) : sortedValues.slice((n + 1) / 2);
  const q1 = lowerHalf.length > 0 ? medianOfSorted(lowerHalf) : sortedValues[0];
  const q3 = upperHalf.length > 0 ? medianOfSorted(upperHalf) : sortedValues[n - 1];

  const frequency = new Map<number, number>();
  values.forEach((value) => frequency.set(value, (frequency.get(value) ?? 0) + 1));
  const maxFrequency = Math.max(...frequency.values());
  const modes =
    n > 1 && maxFrequency === 1
      ? []
      : [...frequency.entries()]
          .filter(([, count]) => count === maxFrequency)
          .map(([value]) => value)
          .sort((a, b) => a - b);

  return {
    n,
    values,
    sortedIndices,
    mean,
    median,
    medianValueIndices,
    modes,
    min: sortedValues[0],
    max: sortedValues[n - 1],
    q1,
    q3,
  };
}
