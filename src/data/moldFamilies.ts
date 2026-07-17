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
  {
    id: 'bottle',
    partName: 'Bouteille',
    compatibleMaterialIds: ['pp', 'pe'],
    allowedCavities: [1, 2, 4],
    baseCavities: 2,
    partVolumeCm3: 35,
    projectedAreaCm2: 28,
    complexityFactor: 1.05,
    buildCostBase: 17000,
    buildTimeDaysBase: 7,
    sellPricePerUnitBase: 0.35,
  },
  {
    id: 'tray',
    partName: 'Barquette alimentaire',
    compatibleMaterialIds: ['pp', 'ps'],
    allowedCavities: [2, 4, 8],
    baseCavities: 4,
    partVolumeCm3: 12,
    projectedAreaCm2: 40,
    complexityFactor: 0.85,
    buildCostBase: 11000,
    buildTimeDaysBase: 5,
    sellPricePerUnitBase: 0.12,
  },
  {
    id: 'automotive_bracket',
    partName: 'Support automobile',
    compatibleMaterialIds: ['pa66', 'abs'],
    allowedCavities: [1, 2],
    baseCavities: 1,
    partVolumeCm3: 45,
    projectedAreaCm2: 38,
    complexityFactor: 1.4,
    buildCostBase: 28000,
    buildTimeDaysBase: 10,
    sellPricePerUnitBase: 2.4,
  },
  {
    id: 'phone_case',
    partName: 'Coque de téléphone',
    compatibleMaterialIds: ['abs', 'pc', 'tpe', 'pmma'],
    allowedCavities: [1, 2, 4, 8],
    baseCavities: 4,
    partVolumeCm3: 8,
    projectedAreaCm2: 7,
    complexityFactor: 1.0,
    buildCostBase: 15000,
    buildTimeDaysBase: 6,
    sellPricePerUnitBase: 0.65,
  },
  {
    id: 'medical_pipette',
    partName: 'Pipette médicale',
    compatibleMaterialIds: ['pp', 'pom'],
    allowedCavities: [4, 8, 16],
    baseCavities: 8,
    partVolumeCm3: 3,
    projectedAreaCm2: 2.5,
    complexityFactor: 0.9,
    buildCostBase: 19000,
    buildTimeDaysBase: 8,
    sellPricePerUnitBase: 0.09,
  },
  {
    id: 'garden_chair',
    partName: 'Chaise de jardin',
    compatibleMaterialIds: ['pp'],
    allowedCavities: [1, 2],
    baseCavities: 1,
    partVolumeCm3: 850,
    projectedAreaCm2: 620,
    complexityFactor: 1.6,
    buildCostBase: 42000,
    buildTimeDaysBase: 14,
    sellPricePerUnitBase: 6.5,
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
