import type { PressTemplate } from '../sim/entities/press';

export const PRESSES: PressTemplate[] = [
  {
    id: 'press_30t',
    name: 'Presse 30T',
    tonnage: 30,
    costBase: 10000,
    maxInjectionRateCm3s: 25,
    energyKw: 5,
    upkeepPerDay: 7,
  },
  {
    id: 'press_60t',
    name: 'Presse 60T',
    tonnage: 60,
    costBase: 18000,
    maxInjectionRateCm3s: 40,
    energyKw: 9,
    upkeepPerDay: 12,
  },
  {
    id: 'press_120t',
    name: 'Presse 120T',
    tonnage: 120,
    costBase: 34000,
    maxInjectionRateCm3s: 70,
    energyKw: 16,
    upkeepPerDay: 20,
  },
  {
    id: 'press_250t',
    name: 'Presse 250T',
    tonnage: 250,
    costBase: 62000,
    maxInjectionRateCm3s: 120,
    energyKw: 28,
    upkeepPerDay: 34,
  },
  {
    id: 'press_400t',
    name: 'Presse 400T',
    tonnage: 400,
    costBase: 95000,
    maxInjectionRateCm3s: 160,
    energyKw: 38,
    upkeepPerDay: 48,
    requiresTechId: 'press_400t',
  },
  {
    id: 'press_600t',
    name: 'Presse 600T',
    tonnage: 600,
    costBase: 150000,
    maxInjectionRateCm3s: 200,
    energyKw: 55,
    upkeepPerDay: 70,
    requiresTechId: 'press_600t',
  },
];

export function getPressTemplate(id: string): PressTemplate {
  const p = PRESSES.find((t) => t.id === id);
  if (!p) throw new Error(`Unknown press template ${id}`);
  return p;
}
