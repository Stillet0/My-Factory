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
