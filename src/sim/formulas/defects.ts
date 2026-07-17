import { deviationSeverity, type Material } from '../entities/material';
import type { ProcessParams } from '../entities/press';

export interface DefectBreakdown {
  shortShot: number;
  flash: number;
  sinkMark: number;
  warp: number;
}

export interface QualityResult {
  /** 0..1 probability this shot is rejected outright. */
  rejectProbability: number;
  breakdown: DefectBreakdown;
  dominantDefect: keyof DefectBreakdown | null;
}

/**
 * Derives per-shot defect risk from how far the operator's process
 * parameters sit outside the material's ideal window, plus mold wear.
 * - Short shot: melt too cold / pressure or speed too low -> incomplete fill.
 * - Flash (bavure): melt too hot / pressure too high vs. clamp force -> resin escapes the parting line.
 * - Sink marks (retassure): cooling time too short / mold too cold -> insufficient packing.
 * - Warping (gauchissement): mold temp far off target / cooling too short -> uneven shrinkage.
 */
export function computeQuality(params: ProcessParams, material: Material, moldWear: number, clampMarginRatio: number): QualityResult {
  const meltDevLow = params.meltTemp < material.meltTemp.idealMin ? deviationSeverity(params.meltTemp, material.meltTemp) : 0;
  const meltDevHigh = params.meltTemp > material.meltTemp.idealMax ? deviationSeverity(params.meltTemp, material.meltTemp) : 0;
  const pressureDevLow = params.injectionPressure < material.injectionPressure.idealMin
    ? deviationSeverity(params.injectionPressure, material.injectionPressure) : 0;
  const pressureDevHigh = params.injectionPressure > material.injectionPressure.idealMax
    ? deviationSeverity(params.injectionPressure, material.injectionPressure) : 0;
  const speedDevLow = params.injectionSpeed < material.injectionSpeed.idealMin
    ? deviationSeverity(params.injectionSpeed, material.injectionSpeed) : 0;
  const coolDevLow = params.coolingTime < material.coolingTime.idealMin
    ? deviationSeverity(params.coolingTime, material.coolingTime) : 0;
  const moldTempDev = deviationSeverity(params.moldTemp, material.moldTemp);

  const shortShot = clamp01(0.55 * meltDevLow + 0.3 * pressureDevLow + 0.25 * speedDevLow);
  // Under-clamped press (clampMarginRatio < 0) makes flash far more likely at any pressure.
  const clampPenalty = clampMarginRatio < 0 ? Math.min(1.4, -clampMarginRatio * 2.2) : 0;
  const flash = clamp01(0.5 * meltDevHigh + 0.45 * pressureDevHigh + clampPenalty);
  const sinkMark = clamp01(0.5 * coolDevLow + 0.3 * moldTempDev + 0.25 * moldWear);
  const warp = clamp01(0.45 * moldTempDev + 0.3 * coolDevLow + 0.35 * moldWear);

  const breakdown: DefectBreakdown = { shortShot, flash, sinkMark, warp };
  // Combine as independent risks -> probability at least one defect triggers this shot.
  const rejectProbability = clamp01(
    1 - (1 - shortShot) * (1 - flash) * (1 - sinkMark) * (1 - warp),
  );

  let dominant: keyof DefectBreakdown | null = null;
  let max = 0.02; // ignore noise below this
  for (const key of Object.keys(breakdown) as (keyof DefectBreakdown)[]) {
    if (breakdown[key] > max) {
      max = breakdown[key];
      dominant = key;
    }
  }

  return { rejectProbability, breakdown, dominantDefect: dominant };
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
