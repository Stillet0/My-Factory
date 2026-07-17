import type { Press } from '../entities/press';
import type { Mold } from '../entities/mold';

/** Wear added to a press/mold per completed cycle; harsher process conditions
 * (tracked via rejectProbability, passed in by the caller) accelerate wear. */
export function applyCycleWear(press: Press, mold: Mold, rejectProbability: number, moldWearRateMult = 1): void {
  const stress = 1 + rejectProbability * 0.8;
  press.wear = Math.min(1, press.wear + 0.0015 * stress);
  mold.wear = Math.min(1, mold.wear + 0.0022 * stress * moldWearRateMult);
}

/** Probability this press breaks down (enters 'fault') after completing a cycle. */
export function breakdownProbability(press: Press): number {
  return Math.pow(press.wear, 2) * 0.12;
}

export function rollBreakdown(press: Press): boolean {
  return Math.random() < breakdownProbability(press);
}

export const REPAIR_COST_PER_WEAR = 9000;
export const REPAIR_WEAR_RECOVERY = 0.55;
export const PREVENTIVE_COST_PER_WEAR = 3500;
export const PREVENTIVE_WEAR_RECOVERY = 0.25;

export function repairCost(press: Press): number {
  return Math.round(REPAIR_COST_PER_WEAR * (0.3 + press.wear));
}

export function preventiveCost(press: Press): number {
  return Math.round(PREVENTIVE_COST_PER_WEAR * (0.3 + press.wear));
}

export function performRepair(press: Press): void {
  press.wear = Math.max(0, press.wear - REPAIR_WEAR_RECOVERY);
  press.state = 'idle';
  press.faultReason = null;
}

export function performPreventiveMaintenance(press: Press): void {
  press.wear = Math.max(0, press.wear - PREVENTIVE_WEAR_RECOVERY);
}
