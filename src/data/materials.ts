import type { Material } from '../sim/entities/material';

/** Starter resin catalog. Ranges are simplified but directionally realistic
 * for injection molding process windows. */
export const MATERIALS: Material[] = [
  {
    id: 'pp',
    name: 'Polypropylène (PP)',
    meltTemp: { idealMin: 230, idealMax: 250, acceptMin: 210, acceptMax: 270 },
    moldTemp: { idealMin: 25, idealMax: 45, acceptMin: 15, acceptMax: 60 },
    injectionPressure: { idealMin: 700, idealMax: 950, acceptMin: 550, acceptMax: 1150 },
    injectionSpeed: { idealMin: 50, idealMax: 90, acceptMin: 25, acceptMax: 120 },
    coolingTime: { idealMin: 8, idealMax: 14, acceptMin: 5, acceptMax: 22 },
    shrinkageRate: 0.018,
    costPerKg: 1.4,
    density: 0.905,
  },
  {
    id: 'abs',
    name: 'ABS',
    meltTemp: { idealMin: 230, idealMax: 260, acceptMin: 210, acceptMax: 280 },
    moldTemp: { idealMin: 50, idealMax: 75, acceptMin: 35, acceptMax: 90 },
    injectionPressure: { idealMin: 800, idealMax: 1100, acceptMin: 650, acceptMax: 1350 },
    injectionSpeed: { idealMin: 40, idealMax: 80, acceptMin: 20, acceptMax: 110 },
    coolingTime: { idealMin: 10, idealMax: 18, acceptMin: 6, acceptMax: 28 },
    shrinkageRate: 0.006,
    costPerKg: 2.1,
    density: 1.05,
  },
  {
    id: 'pc',
    name: 'Polycarbonate (PC)',
    meltTemp: { idealMin: 285, idealMax: 310, acceptMin: 265, acceptMax: 325 },
    moldTemp: { idealMin: 80, idealMax: 105, acceptMin: 60, acceptMax: 120 },
    injectionPressure: { idealMin: 1000, idealMax: 1400, acceptMin: 800, acceptMax: 1700 },
    injectionSpeed: { idealMin: 35, idealMax: 70, acceptMin: 15, acceptMax: 95 },
    coolingTime: { idealMin: 14, idealMax: 24, acceptMin: 9, acceptMax: 34 },
    shrinkageRate: 0.006,
    costPerKg: 3.6,
    density: 1.2,
  },
];

export function getMaterial(id: string): Material {
  const m = MATERIALS.find((mat) => mat.id === id);
  if (!m) throw new Error(`Unknown material ${id}`);
  return m;
}
