import { describe, it, expect } from 'vitest';
import { computeCustomMoldStats } from './moldDesign';
import { getMoldFamily } from '../../data/moldFamilies';

describe('computeCustomMoldStats', () => {
  const cap = getMoldFamily('cap'); // baseCavities: 4

  it('scales cost/time sub-linearly with cavity count', () => {
    const base = computeCustomMoldStats(cap, cap.baseCavities, 'standard');
    const doubled = computeCustomMoldStats(cap, cap.baseCavities * 2, 'standard');
    expect(doubled.buildCostBase).toBeGreaterThan(base.buildCostBase);
    expect(doubled.buildCostBase).toBeLessThan(base.buildCostBase * 2);
    expect(doubled.buildTimeDaysBase).toBeGreaterThan(base.buildTimeDaysBase);
    expect(doubled.buildTimeDaysBase).toBeLessThan(base.buildTimeDaysBase * 2);
  });

  it('precision tier costs more and builds slower than standard at the same cavity count', () => {
    const standard = computeCustomMoldStats(cap, cap.baseCavities, 'standard');
    const precision = computeCustomMoldStats(cap, cap.baseCavities, 'precision');
    expect(precision.buildCostBase).toBeGreaterThan(standard.buildCostBase);
    expect(precision.buildTimeDaysBase).toBeGreaterThan(standard.buildTimeDaysBase);
  });

  it('precision tier lowers complexity factor and wear rate multiplier', () => {
    const standard = computeCustomMoldStats(cap, cap.baseCavities, 'standard');
    const precision = computeCustomMoldStats(cap, cap.baseCavities, 'precision');
    expect(precision.complexityFactor).toBeLessThan(standard.complexityFactor);
    expect(precision.wearRateMult).toBeLessThan(standard.wearRateMult);
  });

  it('never returns a build time below 1 day', () => {
    const stats = computeCustomMoldStats(cap, 1, 'standard');
    expect(stats.buildTimeDaysBase).toBeGreaterThanOrEqual(1);
  });
});
