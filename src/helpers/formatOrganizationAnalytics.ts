type RangeType = { min: number; max: number; label: string };

export const formatOrganizationAnalytics = <T>(
  values: T[],
  ranges: RangeType[],
  extractor: (item: T) => number | null
): Record<string, number> => {
  const result: Record<string, number> = {};
  ranges.forEach(r => (result[r.label] = 0));

  values.forEach(item => {
    const val = extractor(item);
    if (val == null || isNaN(val)) return;

    const range = ranges.find(r => val >= r.min && val <= r.max);
    if (range) {
      result[range.label]++;
    }
  });

  return result;
}
