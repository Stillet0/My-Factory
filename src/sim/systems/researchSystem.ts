import type { Company } from '../entities/company';
import type { Factory } from '../entities/factory';
import { pushEvent } from '../entities/factory';
import { getTechNode } from '../../data/techtree';

/** Advances the single active research slot by one in-game day; applies the
 * tech's effect and clears the slot once the countdown reaches zero. */
export function dailyResearchUpdate(company: Company, factory: Factory, simTimeMs: number): void {
  if (!company.researchInProgress) return;
  company.researchInProgress.daysRemaining -= 1;
  if (company.researchInProgress.daysRemaining > 0) return;

  const { techId } = company.researchInProgress;
  const node = getTechNode(techId);
  company.researchedTechIds.push(techId);
  company.researchInProgress = null;

  if (node.category === 'quality') {
    company.reputation = Math.min(1, company.reputation + 0.15);
  }
  pushEvent(factory, simTimeMs, 'info', `Recherche terminée : ${node.name}.`);
}
