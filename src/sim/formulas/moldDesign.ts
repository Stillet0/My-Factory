import type { MoldFamily, ToolingTier } from '../../data/moldFamilies';
import { TOOLING_TIERS } from '../../data/moldFamilies';

export interface CustomMoldStats {
  buildCostBase: number;
  buildTimeDaysBase: number;
  complexityFactor: number;
  wearRateMult: number;
}

/** Cost/time scale sub-linearly with cavity count relative to the family's
 * base cavity count (power 0.85, so a higher-cavity mold is a meaningful but
 * not linear investment); tooling tier applies flat multipliers on top. */
export function computeCustomMoldStats(family: MoldFamily, cavities: number, tier: ToolingTier): CustomMoldStats {
  const scale = Math.pow(cavities / family.baseCavities, 0.85);
  const t = TOOLING_TIERS[tier];
  return {
    buildCostBase: Math.round(family.buildCostBase * scale * t.costMult),
    buildTimeDaysBase: Math.max(1, Math.round(family.buildTimeDaysBase * scale * t.timeMult)),
    complexityFactor: Math.round(family.complexityFactor * t.complexityMult * 100) / 100,
    wearRateMult: t.wearRateMult,
  };
}
