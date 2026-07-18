import { describe, it, expect } from 'vitest';
import { createCompany } from '../entities/company';
import { createFactory } from '../entities/factory';
import { createPress } from '../entities/press';
import { createMold } from '../entities/mold';
import { createEmployee } from '../entities/employee';
import { nextContractId, type Contract } from '../entities/contract';
import { repairCost } from './maintenanceSystem';
import { tickLabor, REPAIR_TASK_MS, TUNE_TASK_MS, CHANGEOVER_TASK_MS, DELIVER_TASK_MS } from './laborSystem';

const ON_SHIFT_HOUR = 10; // inside the 'morning' shift window (6-14)

function makeContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: nextContractId(), clientName: 'Test Client', familyId: 'cap', quantity: 1000,
    producedGood: 0, producedReject: 0, pricePerUnit: 0.2, deadlineMs: 999999999,
    minQualityRatio: 0.5, status: 'active', offeredOnMs: 0, penaltyPerMissingUnit: 0.1,
    ...overrides,
  };
}

describe('tickLabor', () => {
  it('an on-shift setter walks to a faulted press, then repairs it once the task timer elapses', () => {
    const company = createCompany();
    const factory = createFactory('f1', 'Test');
    const press = createPress('p1', 'press_60t');
    press.state = 'fault';
    press.faultReason = 'broken';
    press.wear = 0.6;
    factory.presses.push(press);
    const setter = createEmployee('setter', 'morning', 0, 'Régleur');
    factory.employees.push(setter);
    const cashBefore = company.cash;
    const cost = repairCost(press);

    tickLabor(company, factory, 0, ON_SHIFT_HOUR);
    expect(setter.task).toBe('repair');
    expect(setter.assignedPressId).toBe(press.id);
    expect(press.state).toBe('fault'); // not fixed yet, still travelling/working

    tickLabor(company, factory, REPAIR_TASK_MS, ON_SHIFT_HOUR);
    expect(press.state).toBe('idle');
    expect(press.faultReason).toBeNull();
    expect(company.cash).toBeCloseTo(cashBefore - cost);
    expect(setter.task).toBeNull();
  });

  it('does not send an off-shift setter to a faulted press', () => {
    const company = createCompany();
    const factory = createFactory('f1', 'Test');
    const press = createPress('p1', 'press_60t');
    press.state = 'fault';
    factory.presses.push(press);
    const setter = createEmployee('setter', 'morning', 0, 'Régleur');
    factory.employees.push(setter);

    tickLabor(company, factory, 0, 2); // 2am, well outside the morning shift
    expect(setter.task).toBeNull();
    expect(press.state).toBe('fault');
  });

  it('a setter nudges badly-drifted process params back toward the material ideal window', () => {
    const company = createCompany();
    const factory = createFactory('f1', 'Test');
    const press = createPress('p1', 'press_60t');
    press.materialId = 'pp';
    press.params.meltTemp = 10; // absurdly cold vs. PP's ideal window
    factory.presses.push(press);
    const setter = createEmployee('setter', 'morning', 0, 'Régleur');
    setter.skill = 1; // full correction for a deterministic assertion
    factory.employees.push(setter);

    tickLabor(company, factory, 0, ON_SHIFT_HOUR);
    expect(setter.task).toBe('tune');

    tickLabor(company, factory, TUNE_TASK_MS, ON_SHIFT_HOUR);
    expect(press.params.meltTemp).toBeGreaterThan(10);
    expect(setter.task).toBeNull();
  });

  it('a forklift delivers a press\'s pending units into the assigned contract, then clears the buffer', () => {
    const company = createCompany();
    const factory = createFactory('f1', 'Test');
    const press = createPress('p1', 'press_60t');
    const contract = makeContract();
    factory.activeContracts.push(contract);
    press.contractId = contract.id;
    press.pendingGoodUnits = 42;
    factory.presses.push(press);
    const forklift = createEmployee('forklift', 'morning', 0, 'Cariste');
    factory.employees.push(forklift);

    tickLabor(company, factory, 0, ON_SHIFT_HOUR);
    expect(forklift.task).toBe('deliver');
    expect(contract.producedGood).toBe(0); // still in transit

    tickLabor(company, factory, DELIVER_TASK_MS, ON_SHIFT_HOUR);
    expect(contract.producedGood).toBe(42);
    expect(press.pendingGoodUnits).toBe(0);
    expect(forklift.task).toBeNull();
  });

  it('a setter readies an unassigned press by reusing its mounted mold/operator for a matching contract', () => {
    const company = createCompany();
    const factory = createFactory('f1', 'Test');
    const press = createPress('p1', 'press_60t');
    const mold = createMold('mold_cap', 'm1');
    factory.molds.push(mold);
    press.moldId = mold.id;
    press.materialId = 'pp';
    // Already dialed in, so the setter won't immediately chain into a 'tune'
    // task right after the changeover — keeps this assertion about the
    // changeover itself.
    press.params = { meltTemp: 240, moldTemp: 35, injectionPressure: 800, injectionSpeed: 70, coolingTime: 10 };
    const operator = createEmployee('operator', 'morning', 0, 'Marc');
    factory.employees.push(operator);
    press.operatorId = operator.id;
    // press.contractId left null, as if its previous contract just settled
    factory.presses.push(press);
    const contract = makeContract({ familyId: 'cap' });
    factory.activeContracts.push(contract);
    const setter = createEmployee('setter', 'morning', 0, 'Régleur');
    factory.employees.push(setter);

    tickLabor(company, factory, 0, ON_SHIFT_HOUR);
    expect(setter.task).toBe('changeover');

    tickLabor(company, factory, CHANGEOVER_TASK_MS, ON_SHIFT_HOUR);
    expect(press.contractId).toBe(contract.id);
    expect(press.moldId).toBe(mold.id); // reused, no need to swap
    expect(press.operatorId).toBe(operator.id); // reused
    expect(setter.task).toBeNull();
  });

  it('a setter mounts a different free mold when the press has none matching the next contract', () => {
    const company = createCompany();
    const factory = createFactory('f1', 'Test');
    const press = createPress('p1', 'press_60t');
    factory.presses.push(press); // no mold, no operator, no contract at all
    const mold = createMold('mold_cap', 'm1');
    factory.molds.push(mold);
    factory.materialStockKg['pp'] = 100;
    const operator = createEmployee('operator', 'morning', 0, 'Marc');
    factory.employees.push(operator);
    const contract = makeContract({ familyId: 'cap' });
    factory.activeContracts.push(contract);
    const setter = createEmployee('setter', 'morning', 0, 'Régleur');
    factory.employees.push(setter);

    tickLabor(company, factory, 0, ON_SHIFT_HOUR);
    expect(setter.task).toBe('changeover');

    tickLabor(company, factory, CHANGEOVER_TASK_MS, ON_SHIFT_HOUR);
    expect(press.moldId).toBe(mold.id);
    expect(press.materialId).toBe('pp');
    expect(press.operatorId).toBe(operator.id);
    expect(press.contractId).toBe(contract.id);
  });

  it('does not dispatch a setter for changeover when no compatible mold is available', () => {
    const company = createCompany();
    const factory = createFactory('f1', 'Test');
    const press = createPress('p1', 'press_60t');
    factory.presses.push(press); // no molds in the factory at all
    const contract = makeContract({ familyId: 'cap' });
    factory.activeContracts.push(contract);
    const setter = createEmployee('setter', 'morning', 0, 'Régleur');
    factory.employees.push(setter);

    tickLabor(company, factory, 0, ON_SHIFT_HOUR);
    expect(setter.task).toBeNull();
    expect(press.contractId).toBeNull();
  });

  it('does not double-assign two setters to the same faulted press', () => {
    const company = createCompany();
    const factory = createFactory('f1', 'Test');
    const press = createPress('p1', 'press_60t');
    press.state = 'fault';
    factory.presses.push(press);
    const setterA = createEmployee('setter', 'morning', 0, 'A');
    const setterB = createEmployee('setter', 'morning', 0, 'B');
    factory.employees.push(setterA, setterB);

    tickLabor(company, factory, 0, ON_SHIFT_HOUR);
    const assigned = [setterA.task, setterB.task].filter((t) => t === 'repair').length;
    expect(assigned).toBe(1);
  });
});
