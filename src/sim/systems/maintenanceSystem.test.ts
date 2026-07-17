import { describe, it, expect } from 'vitest';
import { createPress } from '../entities/press';
import { createMold } from '../entities/mold';
import {
  applyCycleWear,
  breakdownProbability,
  performRepair,
  performPreventiveMaintenance,
  repairCost,
  preventiveCost,
} from './maintenanceSystem';

describe('maintenanceSystem', () => {
  it('breakdown probability rises with wear', () => {
    const press = createPress('p1', 'press_60t');
    press.wear = 0.1;
    const lowRisk = breakdownProbability(press);
    press.wear = 0.9;
    const highRisk = breakdownProbability(press);
    expect(highRisk).toBeGreaterThan(lowRisk);
  });

  it('applyCycleWear increases press and mold wear', () => {
    const press = createPress('p1', 'press_60t');
    const mold = createMold('mold_cap', 'm1');
    const before = press.wear;
    applyCycleWear(press, mold, 0.9);
    expect(press.wear).toBeGreaterThan(before);
    expect(mold.wear).toBeGreaterThan(0);
  });

  it('applyCycleWear scales mold wear growth by moldWearRateMult', () => {
    const pressA = createPress('p1', 'press_60t');
    const moldA = createMold('mold_cap', 'm1');
    applyCycleWear(pressA, moldA, 0.5, 1);

    const pressB = createPress('p2', 'press_60t');
    const moldB = createMold('mold_cap', 'm2');
    applyCycleWear(pressB, moldB, 0.5, 0.5);

    expect(moldB.wear).toBeCloseTo(moldA.wear / 2);
  });

  it('performRepair resets wear and clears the fault state', () => {
    const press = createPress('p1', 'press_60t');
    press.wear = 0.8;
    press.state = 'fault';
    press.faultReason = 'broken';
    performRepair(press);
    expect(press.wear).toBeLessThan(0.8);
    expect(press.state).toBe('idle');
    expect(press.faultReason).toBeNull();
  });

  it('preventive maintenance costs less than a full repair at the same wear', () => {
    const press = createPress('p1', 'press_60t');
    press.wear = 0.6;
    expect(preventiveCost(press)).toBeLessThan(repairCost(press));
  });

  it('performPreventiveMaintenance reduces wear without touching state', () => {
    const press = createPress('p1', 'press_60t');
    press.wear = 0.5;
    press.state = 'idle';
    performPreventiveMaintenance(press);
    expect(press.wear).toBeLessThan(0.5);
    expect(press.state).toBe('idle');
  });
});
