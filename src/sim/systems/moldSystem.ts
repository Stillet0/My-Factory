import type { Company } from '../entities/company';
import type { Factory } from '../entities/factory';
import { pushEvent } from '../entities/factory';
import { createMold } from '../entities/mold';
import { resolveMoldTemplate } from '../../data/molds';

/** Resolves the mold build queue once per in-game day: any entry whose
 * readyOnDay has passed becomes a real Mold on the factory floor. */
export function dailyMoldUpdate(
  company: Company,
  factory: Factory,
  day: number,
  simTimeMs: number,
  nextMoldId: () => string,
): void {
  const stillInProgress: typeof factory.moldsInProgress = [];
  for (const entry of factory.moldsInProgress) {
    if (day >= entry.readyOnDay) {
      const template = resolveMoldTemplate(company, entry.templateId);
      factory.molds.push(createMold(entry.templateId, nextMoldId()));
      pushEvent(factory, simTimeMs, 'info', `Moule prêt : ${template.partName}.`);
    } else {
      stillInProgress.push(entry);
    }
  }
  factory.moldsInProgress = stillInProgress;
}
