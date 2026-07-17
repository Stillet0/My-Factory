import { describe, it, expect, vi, afterEach } from 'vitest';
import { createCompany } from '../entities/company';
import { createFactory } from '../entities/factory';
import { dailyMarketUpdate, computeCompetitorPressure } from './marketSystem';
import { DAY_LENGTH_MS } from '../clock';

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
  it('drops expired offers and fires a contract_lost event naming a rival', () => {
    const company = createCompany();
    const factory = createFactory('f1', 'Test');
    factory.availableContracts.push({
      id: 'ct_1', clientName: 'Embouteilleur régional', familyId: 'cap', quantity: 100,
      producedGood: 0, producedReject: 0, pricePerUnit: 0.2, deadlineMs: 999999999,
      minQualityRatio: 0.9, status: 'offered', offeredOnMs: 0, penaltyPerMissingUnit: 0.1,
    });
    const simTimeMs = 7 * DAY_LENGTH_MS; // past the 6-day shelf life
    dailyMarketUpdate(company, factory, simTimeMs);
    // The expired fixture must be gone — regardless of any new offer the same
    // call may have probabilistically generated (which could reuse the id).
    expect(factory.availableContracts.some((c) => c.clientName === 'Embouteilleur régional' && c.offeredOnMs === 0)).toBe(false);
    expect(factory.events.some((e) => e.kind === 'contract_lost' && e.message.includes('Embouteilleur régional'))).toBe(true);
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
