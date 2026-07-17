import { describe, it, expect } from 'vitest';
import { createCompany } from '../entities/company';
import { createFactory } from '../entities/factory';
import { dailyMoldUpdate } from './moldSystem';

describe('dailyMoldUpdate', () => {
  it('leaves an entry queued when readyOnDay is in the future', () => {
    const company = createCompany();
    const factory = createFactory('f1', 'Test');
    factory.moldsInProgress.push({ id: 'q1', templateId: 'mold_cap', readyOnDay: 5 });
    dailyMoldUpdate(company, factory, 2, 0, () => 'moldinst_1');
    expect(factory.moldsInProgress).toHaveLength(1);
    expect(factory.molds).toHaveLength(0);
  });

  it('materializes a Mold and removes the queue entry once readyOnDay is reached', () => {
    const company = createCompany();
    const factory = createFactory('f1', 'Test');
    factory.moldsInProgress.push({ id: 'q1', templateId: 'mold_cap', readyOnDay: 3 });
    dailyMoldUpdate(company, factory, 3, 0, () => 'moldinst_1');
    expect(factory.moldsInProgress).toHaveLength(0);
    expect(factory.molds).toHaveLength(1);
    expect(factory.molds[0]).toMatchObject({ id: 'moldinst_1', templateId: 'mold_cap' });
    expect(factory.events[0].message).toContain('Moule prêt');
  });

  it('resolves a custom template id via the company registry', () => {
    const company = createCompany();
    company.customMoldTemplates.push({
      id: 'custom_1', familyId: 'cap', partName: 'Bouchon custom', compatibleMaterialIds: ['pp'],
      cavities: 8, partVolumeCm3: 6, projectedAreaCm2: 5, complexityFactor: 0.6, wearRateMult: 0.65,
      buildCostBase: 20000, buildTimeDaysBase: 6, sellPricePerUnitBase: 0.18,
    });
    const factory = createFactory('f1', 'Test');
    factory.moldsInProgress.push({ id: 'q1', templateId: 'custom_1', readyOnDay: 1 });
    dailyMoldUpdate(company, factory, 1, 0, () => 'moldinst_1');
    expect(factory.molds[0].templateId).toBe('custom_1');
    expect(factory.events[0].message).toContain('Bouchon custom');
  });
});
