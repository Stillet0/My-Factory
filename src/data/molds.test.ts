import { describe, it, expect } from 'vitest';
import { resolveMoldTemplate, getMoldTemplate } from './molds';
import { createCompany } from '../sim/entities/company';
import type { MoldTemplate } from '../sim/entities/mold';

describe('resolveMoldTemplate', () => {
  it('falls back to the fixed catalog for a catalog id', () => {
    const company = createCompany();
    expect(resolveMoldTemplate(company, 'mold_cap')).toEqual(getMoldTemplate('mold_cap'));
  });

  it('returns a custom template when present in the company registry', () => {
    const company = createCompany();
    const custom: MoldTemplate = {
      id: 'custom_1',
      familyId: 'cap',
      partName: 'Bouchon (design précision, 8 emp.)',
      compatibleMaterialIds: ['pp'],
      cavities: 8,
      partVolumeCm3: 6,
      projectedAreaCm2: 5,
      complexityFactor: 0.6,
      wearRateMult: 0.65,
      buildCostBase: 20000,
      buildTimeDaysBase: 6,
      sellPricePerUnitBase: 0.18,
    };
    company.customMoldTemplates.push(custom);
    expect(resolveMoldTemplate(company, 'custom_1')).toBe(custom);
  });

  it('still throws for a genuinely unknown id', () => {
    const company = createCompany();
    expect(() => resolveMoldTemplate(company, 'nonexistent')).toThrow();
  });
});
