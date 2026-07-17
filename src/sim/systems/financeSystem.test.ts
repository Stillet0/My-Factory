import { describe, it, expect } from 'vitest';
import { createCompany } from '../entities/company';
import { createFactory } from '../entities/factory';
import { createPress } from '../entities/press';
import { createEmployee } from '../entities/employee';
import { purchasePress, dailyFinanceUpdate, buyMaterial, takeLoan } from './financeSystem';
import { getMaterial } from '../../data/materials';

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
});
