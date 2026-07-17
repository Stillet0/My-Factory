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
  {
    id: 'pa66',
    name: 'Polyamide PA66',
    meltTemp: { idealMin: 275, idealMax: 295, acceptMin: 260, acceptMax: 310 },
    moldTemp: { idealMin: 70, idealMax: 90, acceptMin: 55, acceptMax: 105 },
    injectionPressure: { idealMin: 900, idealMax: 1250, acceptMin: 700, acceptMax: 1500 },
    injectionSpeed: { idealMin: 45, idealMax: 85, acceptMin: 20, acceptMax: 110 },
    coolingTime: { idealMin: 10, idealMax: 18, acceptMin: 6, acceptMax: 26 },
    shrinkageRate: 0.014,
    costPerKg: 4.2,
    density: 1.14,
    requiresTechId: 'material_pa66',
  },
  {
    id: 'tpe',
    name: 'TPE (élastomère thermoplastique)',
    meltTemp: { idealMin: 190, idealMax: 220, acceptMin: 175, acceptMax: 235 },
    moldTemp: { idealMin: 15, idealMax: 35, acceptMin: 10, acceptMax: 50 },
    injectionPressure: { idealMin: 500, idealMax: 800, acceptMin: 380, acceptMax: 950 },
    injectionSpeed: { idealMin: 40, idealMax: 75, acceptMin: 20, acceptMax: 100 },
    coolingTime: { idealMin: 6, idealMax: 12, acceptMin: 4, acceptMax: 20 },
    shrinkageRate: 0.012,
    costPerKg: 3.0,
    density: 1.15,
    requiresTechId: 'material_tpe',
  },
];

export function getMaterial(id: string): Material {
  const m = MATERIALS.find((mat) => mat.id === id);
  if (!m) throw new Error(`Unknown material ${id}`);
  return m;
}
