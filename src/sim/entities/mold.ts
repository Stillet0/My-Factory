export interface MoldTemplate {
  id: string;
  /** Links back to a MoldFamily (data/moldFamilies.ts) — contracts match on this, not on `id`. */
  familyId: string;
  partName: string;
  compatibleMaterialIds: string[];
  cavities: number;
  /** Part volume per cavity, cm3 — drives shot weight and cycle time. */
  partVolumeCm3: number;
  /** Projected (shadow) area per cavity, cm2 — drives required clamp tonnage. */
  projectedAreaCm2: number;
  /** Base cooling time multiplier from wall thickness/geometry complexity (1 = average). */
  complexityFactor: number;
  /** Multiplies mold wear accumulation per cycle — tooling-tier effect (1 = catalog default). */
  wearRateMult: number;
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

let customTemplateSeq = 0;
export function nextCustomMoldTemplateId(): string {
  customTemplateSeq++;
  return `custom_${customTemplateSeq}`;
}

/** Clamp tonnage (metric tons) required to hold this mold shut without flashing,
 * using the classic ~0.3-0.5 tons/cm2 rule of thumb for the cavity pack. */
export function requiredTonnage(template: MoldTemplate, tonnesPerCm2 = 0.4): number {
  return template.projectedAreaCm2 * template.cavities * tonnesPerCm2;
}
