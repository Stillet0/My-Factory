import { describe, it, expect, vi, afterEach } from 'vitest';
import { createCompany } from '../entities/company';
import { createFactory } from '../entities/factory';
import { dailyMarketUpdate, computeCompetitorPressure } from './marketSystem';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('computeCompetitorPressure', () => {
  it('decreases as company reputation rises', () => {
    const low = createCompany();
    low.reputation = 0;
    const high = createCompany();
    high.reputation = 0.9;
    expect(computeCompetitorPressure('cap', high)).toBeLessThan(computeCompetitorPressure('cap', low));
  });

  it('is higher for a family matching a rival specialty than one that has none', () => {
    const company = createCompany();
    company.reputation = 0.3;
    // 'cap' has a specialist rival (PlastiGroupe); 'lid' has none.
    expect(computeCompetitorPressure('cap', company)).toBeGreaterThan(computeCompetitorPressure('lid', company));
  });
});

describe('dailyMarketUpdate', () => {
  it("replaces yesterday's unsigned offers with a fresh daily batch", () => {
    const company = createCompany();
    const factory = createFactory('f1', 'Test');
    factory.availableContracts.push({
      id: 'stale-offer', clientName: 'Embouteilleur régional', familyId: 'cap',
      pricePerUnit: 0.2, producedGood: 0, producedReject: 0, status: 'offered', offeredOnMs: 0,
    });
    dailyMarketUpdate(company, factory, 999_999);
    // Yesterday's fixture object must be gone, even if today's batch happens
    // to re-offer the same client (a fresh contract with a new id/price).
    expect(factory.availableContracts.some((c) => c.id === 'stale-offer')).toBe(false);
  });

  it('generates contracts with familyId and family-derived pricing', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const company = createCompany();
    const factory = createFactory('f1', 'Test');
    dailyMarketUpdate(company, factory, 0);
    expect(factory.availableContracts.length).toBeGreaterThan(0);
    for (const c of factory.availableContracts) {
      expect(typeof c.familyId).toBe('string');
      expect(c.pricePerUnit).toBeGreaterThan(0);
    }
  });
});
