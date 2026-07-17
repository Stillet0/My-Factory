export type ToolingTier = 'standard' | 'precision';

export interface MoldFamily {
  id: string;
  partName: string;
  compatibleMaterialIds: string[];
  allowedCavities: number[];
  /** Anchor cavity count the base stats below are quoted at. */
  baseCavities: number;
  partVolumeCm3: number;
  projectedAreaCm2: number;
  complexityFactor: number;
  buildCostBase: number;
  buildTimeDaysBase: number;
  sellPricePerUnitBase: number;
}

export interface ToolingTierMultipliers {
  costMult: number;
  timeMult: number;
  complexityMult: number;
  wearRateMult: number;
}

export const TOOLING_TIERS: Record<ToolingTier, ToolingTierMultipliers> = {
  standard: { costMult: 1, timeMult: 1, complexityMult: 1, wearRateMult: 1 },
  precision: { costMult: 1.6, timeMult: 1.35, complexityMult: 0.82, wearRateMult: 0.65 },
};

export const MOLD_FAMILIES: MoldFamily[] = [
  {
    id: 'cap',
    partName: 'Bouchon',
    compatibleMaterialIds: ['pp', 'abs'],
    allowedCavities: [1, 2, 4, 8],
    baseCavities: 4,
    partVolumeCm3: 6,
    projectedAreaCm2: 5,
    complexityFactor: 0.75,
    buildCostBase: 9000,
    buildTimeDaysBase: 4,
    sellPricePerUnitBase: 0.18,
  },
  {
    id: 'lid',
    partName: 'Couvercle',
    compatibleMaterialIds: ['pp', 'abs'],
    allowedCavities: [1, 2, 4],
    baseCavities: 2,
    partVolumeCm3: 22,
    projectedAreaCm2: 20,
    complexityFactor: 1.0,
    buildCostBase: 14000,
    buildTimeDaysBase: 6,
    sellPricePerUnitBase: 0.42,
  },
  {
    id: 'housing',
    partName: 'Boîtier électronique',
    compatibleMaterialIds: ['abs', 'pc'],
    allowedCavities: [1, 2],
    baseCavities: 1,
    partVolumeCm3: 58,
    projectedAreaCm2: 45,
    complexityFactor: 1.35,
    buildCostBase: 24000,
    buildTimeDaysBase: 9,
    sellPricePerUnitBase: 1.85,
  },
  {
    id: 'toy',
    partName: 'Figurine jouet',
    compatibleMaterialIds: ['pp', 'abs'],
    allowedCavities: [1, 2, 4, 8],
    baseCavities: 4,
    partVolumeCm3: 14,
    projectedAreaCm2: 12,
    complexityFactor: 1.1,
    buildCostBase: 16000,
    buildTimeDaysBase: 7,
    sellPricePerUnitBase: 0.55,
  },
];

export function getMoldFamily(id: string): MoldFamily {
  const f = MOLD_FAMILIES.find((m) => m.id === id);
  if (!f) throw new Error(`Unknown mold family ${id}`);
  return f;
}

export interface MoldDesignSpec {
  familyId: string;
  cavities: number;
  tier: ToolingTier;
  materialIds: string[];
}
