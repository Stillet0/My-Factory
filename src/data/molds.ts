import type { MoldTemplate } from '../sim/entities/mold';

export const MOLD_TEMPLATES: MoldTemplate[] = [
  {
    id: 'mold_cap',
    partName: 'Bouchon',
    compatibleMaterialIds: ['pp', 'abs'],
    cavities: 4,
    partVolumeCm3: 6,
    projectedAreaCm2: 5,
    complexityFactor: 0.75,
    buildCostBase: 9000,
    buildTimeDaysBase: 4,
    sellPricePerUnitBase: 0.18,
  },
  {
    id: 'mold_lid',
    partName: 'Couvercle',
    compatibleMaterialIds: ['pp', 'abs'],
    cavities: 2,
    partVolumeCm3: 22,
    projectedAreaCm2: 20,
    complexityFactor: 1.0,
    buildCostBase: 14000,
    buildTimeDaysBase: 6,
    sellPricePerUnitBase: 0.42,
  },
  {
    id: 'mold_housing',
    partName: 'Boîtier électronique',
    compatibleMaterialIds: ['abs', 'pc'],
    cavities: 1,
    partVolumeCm3: 58,
    projectedAreaCm2: 45,
    complexityFactor: 1.35,
    buildCostBase: 24000,
    buildTimeDaysBase: 9,
    sellPricePerUnitBase: 1.85,
  },
  {
    id: 'mold_toy',
    partName: 'Figurine jouet',
    compatibleMaterialIds: ['pp', 'abs'],
    cavities: 4,
    partVolumeCm3: 14,
    projectedAreaCm2: 12,
    complexityFactor: 1.1,
    buildCostBase: 16000,
    buildTimeDaysBase: 7,
    sellPricePerUnitBase: 0.55,
  },
];

export function getMoldTemplate(id: string): MoldTemplate {
  const t = MOLD_TEMPLATES.find((m) => m.id === id);
  if (!t) throw new Error(`Unknown mold template ${id}`);
  return t;
}
