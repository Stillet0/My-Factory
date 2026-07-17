import { describe, it, expect } from 'vitest';
import { createCompany } from '../entities/company';
import { createFactory } from '../entities/factory';
import { createPress } from '../entities/press';
import { createEmployee } from '../entities/employee';
import {
  purchasePress, dailyFinanceUpdate, buyMaterial, takeLoan, designMold, startResearch,
  foundFactory, foundFactoryCost, transferMaterialCost, chargeMaterialTransfer, chargeMoldTransfer, MOLD_TRANSFER_COST,
} from './financeSystem';
import { getMaterial } from '../../data/materials';
import { getMoldFamily } from '../../data/moldFamilies';

describe('financeSystem', () => {
  it('purchasePress rejects when cash is insufficient', () => {
    const company = createCompany();
    company.cash = 100;
    const result = purchasePress(company, 'press_60t');
    expect(result.ok).toBe(false);
    expect(company.cash).toBe(100);
  });

  it('purchasePress deducts the template cost on success', () => {
    const company = createCompany();
    company.cash = 50000;
    const result = purchasePress(company, 'press_60t');
    expect(result.ok).toBe(true);
    expect(company.cash).toBe(50000 - 18000);
  });

  it('dailyFinanceUpdate deducts wages and press upkeep, and records history', () => {
    const company = createCompany();
    company.cash = 10000;
    const factory = createFactory('f1', 'Test');
    factory.employees.push(createEmployee('operator', 'morning', 0, 'Test Op'));
    factory.presses.push(createPress('p1', 'press_60t'));
    company.factories.push(factory);

    dailyFinanceUpdate(company, factory, 1);

    const expectedExpenses = 95 + 12; // operator wage + press_60t upkeep
    expect(company.cash).toBe(10000 - expectedExpenses);
    expect(company.history).toHaveLength(1);
    expect(company.history[0].expenses).toBe(expectedExpenses);
  });

  it('buyMaterial adds stock and deducts cash at the current price multiplier', () => {
    const company = createCompany();
    company.cash = 1000;
    company.materialPriceMultipliers['pp'] = 1;
    const factory = createFactory('f1', 'Test');
    const material = getMaterial('pp');

    const result = buyMaterial(company, factory, 'pp', 100, material.costPerKg);

    expect(result.ok).toBe(true);
    expect(factory.materialStockKg['pp']).toBe(100);
    expect(company.cash).toBeCloseTo(1000 - 100 * material.costPerKg);
  });

  it('takeLoan increases cash and registers a loan', () => {
    const company = createCompany();
    const before = company.cash;
    takeLoan(company, 5000);
    expect(company.cash).toBe(before + 5000);
    expect(company.loans).toHaveLength(1);
    expect(company.loans[0].remaining).toBe(5000);
  });

  describe('designMold', () => {
    const cap = getMoldFamily('cap');

    it('rejects an invalid cavity count', () => {
      const company = createCompany();
      const result = designMold(company, cap, 3, 'standard', ['pp']);
      expect(result.ok).toBe(false);
    });

    it('rejects an empty material selection', () => {
      const company = createCompany();
      const result = designMold(company, cap, cap.baseCavities, 'standard', []);
      expect(result.ok).toBe(false);
    });

    it('rejects insufficient cash', () => {
      const company = createCompany();
      company.cash = 10;
      const result = designMold(company, cap, cap.baseCavities, 'standard', ['pp']);
      expect(result.ok).toBe(false);
    });

    it('on success deducts cash and registers a custom template with the right familyId/cavities', () => {
      const company = createCompany();
      company.cash = 50000;
      const result = designMold(company, cap, cap.baseCavities, 'standard', ['pp']);
      expect(result.ok).toBe(true);
      expect(company.cash).toBeLessThan(50000);
      expect(company.customMoldTemplates).toHaveLength(1);
      expect(company.customMoldTemplates[0].familyId).toBe('cap');
      expect(company.customMoldTemplates[0].cavities).toBe(cap.baseCavities);
    });
  });

  describe('startResearch', () => {
    it('rejects insufficient cash', () => {
      const company = createCompany();
      company.cash = 10;
      expect(startResearch(company, 'material_pa66').ok).toBe(false);
    });

    it('rejects when a prerequisite is missing', () => {
      const company = createCompany();
      company.cash = 100000;
      expect(startResearch(company, 'quality_iatf').ok).toBe(false);
    });

    it('rejects when a research is already in progress', () => {
      const company = createCompany();
      company.cash = 100000;
      expect(startResearch(company, 'material_pa66').ok).toBe(true);
      expect(startResearch(company, 'material_tpe').ok).toBe(false);
    });

    it('on success deducts cost and sets researchInProgress', () => {
      const company = createCompany();
      company.cash = 100000;
      const result = startResearch(company, 'material_pa66');
      expect(result.ok).toBe(true);
      expect(company.cash).toBe(100000 - 30000);
      expect(company.researchInProgress).toEqual({ techId: 'material_pa66', daysRemaining: 8 });
    });
  });

  describe('foundFactory', () => {
    it('cost rises with each existing factory', () => {
      const company = createCompany();
      company.factories.push(createFactory('f1', 'Usine 1'));
      const costFor2nd = foundFactoryCost(company);
      company.factories.push(createFactory('f2', 'Usine 2'));
      const costFor3rd = foundFactoryCost(company);
      expect(costFor3rd).toBeGreaterThan(costFor2nd);
    });

    it('rejects insufficient cash', () => {
      const company = createCompany();
      company.factories.push(createFactory('f1', 'Usine 1'));
      company.cash = 10;
      expect(foundFactory(company).ok).toBe(false);
    });

    it('deducts the scaled cost on success', () => {
      const company = createCompany();
      company.factories.push(createFactory('f1', 'Usine 1'));
      company.cash = 1000000;
      const cost = foundFactoryCost(company);
      const result = foundFactory(company);
      expect(result.ok).toBe(true);
      expect(company.cash).toBe(1000000 - cost);
    });
  });

  describe('inter-factory transfer costs', () => {
    it('transferMaterialCost scales with kg', () => {
      expect(transferMaterialCost(200)).toBeGreaterThan(transferMaterialCost(100));
    });

    it('chargeMaterialTransfer rejects insufficient cash and deducts on success', () => {
      const poor = createCompany();
      poor.cash = 1;
      expect(chargeMaterialTransfer(poor, 500).ok).toBe(false);

      const rich = createCompany();
      rich.cash = 10000;
      const cost = transferMaterialCost(500);
      expect(chargeMaterialTransfer(rich, 500).ok).toBe(true);
      expect(rich.cash).toBe(10000 - cost);
    });

    it('chargeMoldTransfer rejects insufficient cash and deducts the flat cost on success', () => {
      const poor = createCompany();
      poor.cash = 1;
      expect(chargeMoldTransfer(poor).ok).toBe(false);

      const rich = createCompany();
      rich.cash = 10000;
      expect(chargeMoldTransfer(rich).ok).toBe(true);
      expect(rich.cash).toBe(10000 - MOLD_TRANSFER_COST);
    });
  });
});
