export function normalize(values) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  return values.map(v =>
    max === min ? 0 : ((v - min) / (max - min)) * 2 - 1
  );
}
