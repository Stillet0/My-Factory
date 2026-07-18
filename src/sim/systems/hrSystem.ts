import type { Factory } from '../entities/factory';
import { pushEvent } from '../entities/factory';
import { isOnShiftNow } from '../entities/employee';

/** Continuous fatigue drift, called every tick. */
export function tickFatigue(factory: Factory, tickMs: number, hourOfDay: number): void {
  const hours = tickMs / 3_600_000;
  for (const emp of factory.employees) {
    if (isOnShiftNow(emp.shift, hourOfDay)) {
      emp.fatigue = Math.min(1, emp.fatigue + hours * 0.09);
    } else {
      emp.fatigue = Math.max(0, emp.fatigue - hours * 0.16);
    }
  }
}

/** Keeps every ready press (mold + material + contract set, not automated)
 * staffed with whichever on-shift operator is free to cover it. Operators
 * self-assign to an unmanned press and hand off automatically as shifts
 * turn over — the player only needs to hire enough coverage, not re-pick
 * an operator by hand every 8 hours. Never pulls an operator off a press
 * they're already covering, so a stable assignment isn't churned for no
 * reason. */
export function tickOperatorStaffing(factory: Factory, hourOfDay: number): void {
  for (const press of factory.presses) {
    if (press.automated) continue;
    if (!press.moldId || !press.materialId || !press.contractId) continue;

    const current = press.operatorId ? factory.employees.find((e) => e.id === press.operatorId) : undefined;
    if (current && isOnShiftNow(current.shift, hourOfDay)) continue;

    const replacement = factory.employees.find(
      (e) =>
        e.role === 'operator' &&
        isOnShiftNow(e.shift, hourOfDay) &&
        !factory.presses.some((p) => p.id !== press.id && p.operatorId === e.id),
    );
    if (replacement) press.operatorId = replacement.id;
  }
}

/** Slower morale/skill/turnover pass, called once per in-game day. */
export function dailyHrUpdate(factory: Factory, simTimeMs: number): void {
  const remaining: typeof factory.employees = [];
  for (const emp of factory.employees) {
    const moraleTarget = 0.85 - emp.fatigue * 0.5;
    emp.morale += (moraleTarget - emp.morale) * 0.35;
    emp.morale = Math.max(0, Math.min(1, emp.morale));
    emp.skill = Math.min(1, emp.skill + 0.004);

    if (emp.morale < 0.18 && Math.random() < 0.25) {
      pushEvent(factory, simTimeMs, 'quit', `${emp.name} démissionne (moral trop bas).`);
      for (const press of factory.presses) {
        if (press.operatorId === emp.id) press.operatorId = null;
      }
      continue;
    }
    remaining.push(emp);
  }
  factory.employees = remaining;
}
