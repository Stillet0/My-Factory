import { describe, it, expect } from 'vitest';
import { createCompany } from '../entities/company';
import { createFactory } from '../entities/factory';
import { dailyResearchUpdate } from './researchSystem';

describe('dailyResearchUpdate', () => {
  it('no-ops when no research is in progress', () => {
    const company = createCompany();
    const factory = createFactory('f1', 'Test');
    dailyResearchUpdate(company, factory, 0);
    expect(company.researchInProgress).toBeNull();
    expect(company.researchedTechIds).toHaveLength(0);
  });

  it('decrements daysRemaining without completing early', () => {
    const company = createCompany();
    const factory = createFactory('f1', 'Test');
    company.researchInProgress = { techId: 'material_pa66', daysRemaining: 3 };
    dailyResearchUpdate(company, factory, 0);
    expect(company.researchInProgress).toEqual({ techId: 'material_pa66', daysRemaining: 2 });
    expect(company.researchedTechIds).toHaveLength(0);
  });

  it('completes research, clears the slot, and pushes a factory event', () => {
    const company = createCompany();
    const factory = createFactory('f1', 'Test');
    company.researchInProgress = { techId: 'material_pa66', daysRemaining: 1 };
    dailyResearchUpdate(company, factory, 0);
    expect(company.researchInProgress).toBeNull();
    expect(company.researchedTechIds).toContain('material_pa66');
    expect(factory.events[0].message).toContain('Recherche terminée');
  });

  it('bumps reputation by 0.15 (clamped to 1) when a quality-category tech completes', () => {
    const company = createCompany();
    company.reputation = 0.9;
    const factory = createFactory('f1', 'Test');
    company.researchInProgress = { techId: 'quality_iso9001', daysRemaining: 1 };
    dailyResearchUpdate(company, factory, 0);
    expect(company.reputation).toBe(1);
  });

  it('does not touch reputation for a non-quality tech', () => {
    const company = createCompany();
    const before = company.reputation;
    const factory = createFactory('f1', 'Test');
    company.researchInProgress = { techId: 'automation_1', daysRemaining: 1 };
    dailyResearchUpdate(company, factory, 0);
    expect(company.reputation).toBe(before);
  });
});
