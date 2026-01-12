import { MOMENTUM_WEIGHTS } from "../config/weights.js";
import { normalize } from "./normalize.js";

export function calculateMomentum(data) {
  // нормализуем отдельно, но данные не теряем
  const volumeNorm = normalize(data.map(d => d.volumeAccel));
  const oiNorm = normalize(data.map(d => d.oiDelta));
  const fundingNorm = normalize(data.map(d => d.fundingDelta));

  return data.map((d, i) => {
    const score =
      MOMENTUM_WEIGHTS.volume * volumeNorm[i] +
      MOMENTUM_WEIGHTS.openInterest * oiNorm[i] +
      MOMENTUM_WEIGHTS.funding * fundingNorm[i];

    return {
      ...d,          // 🔥 КЛЮЧЕВАЯ СТРОКА
      score
    };
  });
}
