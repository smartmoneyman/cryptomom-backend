export function classify(score) {
  if (score >= 0.6) return "accelerating";
  if (score >= 0.3) return "building";
  if (score <= -0.6) return "fading";
  if (score <= -0.3) return "cooling";
  return "stable";
}
