export interface MoldTemplate {
  id: string;
  partName: string;
  compatibleMaterialIds: string[];
  cavities: number;
  /** Part volume per cavity, cm3 — drives shot weight and cycle time. */
  partVolumeCm3: number;
  /** Projected (shadow) area per cavity, cm2 — drives required clamp tonnage. */
  projectedAreaCm2: number;
  /** Base cooling time multiplier from wall thickness/geometry complexity (1 = average). */
  complexityFactor: number;
  buildCostBase: number;
  buildTimeDaysBase: number;
  sellPricePerUnitBase: number;
}

export interface Mold {
  id: string;
  templateId: string;
  wear: number; // 0..1
  cyclesRun: number;
}

export function createMold(templateId: string, id: string): Mold {
  return { id, templateId, wear: 0, cyclesRun: 0 };
}

/** Clamp tonnage (metric tons) required to hold this mold shut without flashing,
 * using the classic ~0.3-0.5 tons/cm2 rule of thumb for the cavity pack. */
export function requiredTonnage(template: MoldTemplate, tonnesPerCm2 = 0.4): number {
  return template.projectedAreaCm2 * template.cavities * tonnesPerCm2;
}
