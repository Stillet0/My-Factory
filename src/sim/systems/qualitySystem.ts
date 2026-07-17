import type { QualityResult } from '../formulas/defects';

export interface ShotOutcome {
  good: number;
  reject: number;
  dominantDefect: QualityResult['dominantDefect'];
}

/** Rolls each cavity of a shot independently against the reject probability. */
export function rollShotOutcome(quality: QualityResult, cavities: number): ShotOutcome {
  let good = 0;
  let reject = 0;
  for (let i = 0; i < cavities; i++) {
    if (Math.random() < quality.rejectProbability) reject++;
    else good++;
  }
  return { good, reject, dominantDefect: quality.dominantDefect };
}
