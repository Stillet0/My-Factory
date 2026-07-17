import { describe, it, expect } from 'vitest';
import { computeQuality } from './defects';
import { getMaterial } from '../../data/materials';

describe('computeQuality', () => {
  const pp = getMaterial('pp');

  it('returns near-zero reject risk when parameters sit in the ideal window', () => {
    const result = computeQuality(
      { meltTemp: 240, moldTemp: 35, injectionPressure: 850, injectionSpeed: 70, coolingTime: 11 },
      pp,
      0,
      0.5,
    );
    expect(result.rejectProbability).toBeLessThan(0.05);
  });

  it('flags short shot risk when melt temp is far below the ideal window', () => {
    const result = computeQuality(
      { meltTemp: 210, moldTemp: 35, injectionPressure: 850, injectionSpeed: 70, coolingTime: 11 },
      pp,
      0,
      0.5,
    );
    expect(result.breakdown.shortShot).toBeGreaterThan(0.3);
    expect(result.dominantDefect).toBe('shortShot');
  });

  it('flags flash risk when the press is under-clamped for the mold', () => {
    const result = computeQuality(
      { meltTemp: 240, moldTemp: 35, injectionPressure: 850, injectionSpeed: 70, coolingTime: 11 },
      pp,
      0,
      -0.3,
    );
    expect(result.breakdown.flash).toBeGreaterThan(0.3);
  });

  it('flags sink marks when cooling time is too short', () => {
    const result = computeQuality(
      { meltTemp: 240, moldTemp: 35, injectionPressure: 850, injectionSpeed: 70, coolingTime: 5 },
      pp,
      0,
      0.5,
    );
    expect(result.breakdown.sinkMark).toBeGreaterThan(0.2);
  });

  it('raises every defect type as mold wear increases', () => {
    const params = { meltTemp: 240, moldTemp: 35, injectionPressure: 850, injectionSpeed: 70, coolingTime: 11 };
    const fresh = computeQuality(params, pp, 0, 0.5);
    const worn = computeQuality(params, pp, 0.9, 0.5);
    expect(worn.breakdown.sinkMark).toBeGreaterThan(fresh.breakdown.sinkMark);
    expect(worn.breakdown.warp).toBeGreaterThan(fresh.breakdown.warp);
  });
});
