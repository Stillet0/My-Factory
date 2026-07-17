import { describe, it, expect } from 'vitest';
import { createCompany } from '../entities/company';
import { createFactory } from '../entities/factory';
import { createPress } from '../entities/press';
import { createMold } from '../entities/mold';
import { nextContractId, type Contract } from '../entities/contract';
import { tickProduction, applyAutomationPenalty, automationPenaltyFor } from './productionSystem';

describe('applyAutomationPenalty', () => {
  it('returns the input unchanged when not automated', () => {
    expect(applyAutomationPenalty(0.2, false)).toBe(0.2);
  });

  it('adds a flat 0.03 penalty by default when automated', () => {
    expect(applyAutomationPenalty(0.2, true)).toBeCloseTo(0.23);
  });

  it('accepts a custom penalty amount', () => {
    expect(applyAutomationPenalty(0.2, true, 0.01)).toBeCloseTo(0.21);
  });

  it('clamps the penalized probability to 1', () => {
    expect(applyAutomationPenalty(0.99, true)).toBe(1);
  });
});

describe('automationPenaltyFor', () => {
  it('is 0.03 without the advanced automation tech', () => {
    const company = createCompany();
    expect(automationPenaltyFor(company)).toBe(0.03);
  });

  it('drops to 0.01 once automation_2 is researched', () => {
    const company = createCompany();
    company.researchedTechIds.push('automation_2');
    expect(automationPenaltyFor(company)).toBe(0.01);
  });
});

function makeContract(): Contract {
  return {
    id: nextContractId(), clientName: 'Test Client', familyId: 'cap', quantity: 1000,
    producedGood: 0, producedReject: 0, pricePerUnit: 0.2, deadlineMs: 999999999,
    minQualityRatio: 0.5, status: 'active', offeredOnMs: 0, penaltyPerMissingUnit: 0.1,
  };
}

describe('tryStartCycle (via tickProduction)', () => {
  it('an automated press starts a cycle with no operator assigned', () => {
    const company = createCompany();
    const factory = createFactory('f1', 'Test');
    const press = createPress('p1', 'press_60t');
    press.automated = true;
    const mold = createMold('mold_cap', 'm1');
    factory.presses.push(press);
    factory.molds.push(mold);
    factory.materialStockKg['pp'] = 500;
    factory.activeContracts.push(makeContract());
    press.moldId = mold.id;
    press.materialId = 'pp';
    press.contractId = factory.activeContracts[0].id;

    tickProduction(company, factory, 250, 0, 3); // hour 3 = the middle of the night, no shift active

    expect(press.state).not.toBe('idle');
  });

  it('a non-automated press with no operator does not start a cycle', () => {
    const company = createCompany();
    const factory = createFactory('f1', 'Test');
    const press = createPress('p1', 'press_60t');
    const mold = createMold('mold_cap', 'm1');
    factory.presses.push(press);
    factory.molds.push(mold);
    factory.materialStockKg['pp'] = 500;
    factory.activeContracts.push(makeContract());
    press.moldId = mold.id;
    press.materialId = 'pp';
    press.contractId = factory.activeContracts[0].id;

    tickProduction(company, factory, 250, 0, 3);

    expect(press.state).toBe('idle');
  });
});
