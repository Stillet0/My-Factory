import type { Company } from '../entities/company';
import type { Factory } from '../entities/factory';
import { pushEvent } from '../entities/factory';
import { isOnShiftNow, type Employee } from '../entities/employee';
import type { Press } from '../entities/press';
import type { ProcessRange } from '../entities/material';
import { deviationSeverity } from '../entities/material';
import type { Contract } from '../entities/contract';
import { getMaterial } from '../../data/materials';
import { getPressTemplate } from '../../data/presses';
import { resolveMoldTemplate } from '../../data/molds';
import { repairCost, performRepair } from './maintenanceSystem';

export const REPAIR_TASK_MS = 30_000;
export const TUNE_TASK_MS = 18_000;
export const CHANGEOVER_TASK_MS = 40_000;
export const DELIVER_TASK_MS = 22_000;

/** A parameter is flagged for a setter visit once it drifts this far past
 * the material's ideal window (0 = right on the edge of ideal, 1 = at the
 * outer edge of the still-acceptable range). */
const TUNE_SEVERITY_THRESHOLD = 0.12;

type SetterTask = 'repair' | 'tune' | 'changeover';

/** Setters autonomously walk from press to press, repairing breakdowns,
 * correcting drifted process parameters, and readying an idle press for its
 * next contract (picking a compatible mold/material/operator and mounting
 * them); forklifts walk boxed output to shipping, crediting the contract
 * only once actually delivered. Both only act while on shift — an
 * idle/off-shift setter or forklift just waits. */
export function tickLabor(company: Company, factory: Factory, simTimeMs: number, hourOfDay: number): void {
  for (const emp of factory.employees) {
    if (emp.role !== 'setter' && emp.role !== 'forklift') continue;
    if (!isOnShiftNow(emp.shift, hourOfDay)) continue;

    if (emp.task && simTimeMs >= emp.taskEndMs) {
      completeTask(company, factory, emp, simTimeMs);
    }
    if (!emp.task) {
      assignTask(company, factory, emp, simTimeMs);
    }
  }
}

function completeTask(company: Company, factory: Factory, emp: Employee, simTimeMs: number): void {
  const press = factory.presses.find((p) => p.id === emp.assignedPressId);
  if (press) {
    const templateName = getPressTemplate(press.templateId).name;
    if (emp.task === 'repair' && press.state === 'fault' && company.cash >= repairCost(press)) {
      company.cash -= repairCost(press);
      performRepair(press);
      pushEvent(factory, simTimeMs, 'info', `${emp.name} a réparé ${templateName}.`);
    } else if (emp.task === 'tune') {
      retuneTowardIdeal(press, emp.skill);
      pushEvent(factory, simTimeMs, 'info', `${emp.name} a corrigé les réglages de ${templateName}.`);
    } else if (emp.task === 'changeover') {
      // Re-plan from the current state rather than trusting the plan made
      // when the setter set off — a player or another setter may have
      // changed things during the walk over.
      const plan = planChangeover(company, factory, press);
      if (plan) {
        press.moldId = plan.moldId;
        press.materialId = plan.materialId;
        press.operatorId = plan.operatorId;
        press.contractId = plan.contract.id;
        pushEvent(factory, simTimeMs, 'info', `${emp.name} a préparé ${templateName} pour ${plan.contract.clientName}.`);
      }
    } else if (emp.task === 'deliver' && press.pendingGoodUnits > 0) {
      const contract = factory.activeContracts.find((c) => c.id === press.contractId);
      const delivered = press.pendingGoodUnits;
      press.pendingGoodUnits = 0;
      if (contract) {
        contract.producedGood += delivered;
        const revenue = round2(delivered * contract.pricePerUnit);
        company.cash += revenue;
        company.dayRevenueAccumulator += revenue;
        pushEvent(factory, simTimeMs, 'info', `${emp.name} a livré et vendu ${delivered} pièces à ${contract.clientName} (+${revenue} €).`);
      }
    }
  }
  emp.task = null;
  emp.assignedPressId = null;
  emp.taskEndMs = 0;
}

function assignTask(company: Company, factory: Factory, emp: Employee, simTimeMs: number): void {
  if (emp.role === 'setter') {
    const target = findSetterTarget(company, factory);
    if (!target) return;
    emp.assignedPressId = target.press.id;
    emp.task = target.task;
    const durationMs = target.task === 'repair' ? REPAIR_TASK_MS : target.task === 'changeover' ? CHANGEOVER_TASK_MS : TUNE_TASK_MS;
    emp.taskEndMs = simTimeMs + durationMs;
  } else {
    const target = findDeliveryTarget(factory);
    if (!target) return;
    emp.assignedPressId = target.id;
    emp.task = 'deliver';
    emp.taskEndMs = simTimeMs + DELIVER_TASK_MS;
  }
}

function claimedPressIds(factory: Factory, task: SetterTask | 'deliver'): Set<string> {
  const ids = factory.employees
    .filter((e) => e.task === task && e.assignedPressId)
    .map((e) => e.assignedPressId as string);
  return new Set(ids);
}

function findSetterTarget(company: Company, factory: Factory): { press: Press; task: SetterTask } | null {
  const repairClaimed = claimedPressIds(factory, 'repair');
  const faulty = factory.presses.find((p) => p.state === 'fault' && !repairClaimed.has(p.id) && company.cash >= repairCost(p));
  if (faulty) return { press: faulty, task: 'repair' };

  const changeoverClaimed = claimedPressIds(factory, 'changeover');
  const needsSetup = factory.presses.find(
    (p) => p.state !== 'fault' && !p.contractId && !changeoverClaimed.has(p.id) && planChangeover(company, factory, p) !== null,
  );
  if (needsSetup) return { press: needsSetup, task: 'changeover' };

  const tuneClaimed = claimedPressIds(factory, 'tune');
  const drifted = factory.presses.find((p) => !tuneClaimed.has(p.id) && p.materialId && isBadlyTuned(p));
  if (drifted) return { press: drifted, task: 'tune' };

  return null;
}

function findDeliveryTarget(factory: Factory): Press | null {
  const claimed = claimedPressIds(factory, 'deliver');
  let best: Press | null = null;
  for (const press of factory.presses) {
    if (claimed.has(press.id) || press.pendingGoodUnits <= 0) continue;
    if (!best || press.pendingGoodUnits > best.pendingGoodUnits) best = press;
  }
  return best;
}

interface ChangeoverPlan {
  contract: Contract;
  moldId: string;
  materialId: string;
  operatorId: string | null;
}

/** Picks the best-paying active contract this press could produce for,
 * along with a compatible mold/material/operator it can borrow without
 * pulling them off another currently-mounted press. Pure — used both to
 * decide whether a changeover is worth dispatching a setter for, and to
 * actually apply it once the setter arrives. */
function planChangeover(company: Company, factory: Factory, press: Press): ChangeoverPlan | null {
  const candidates = [...factory.activeContracts].sort((a, b) => b.pricePerUnit - a.pricePerUnit);

  for (const contract of candidates) {
    const currentMold = press.moldId ? factory.molds.find((m) => m.id === press.moldId) : undefined;
    const currentMatches = currentMold && resolveMoldTemplate(company, currentMold.templateId).familyId === contract.familyId;

    const chosenMold = currentMatches
      ? currentMold!
      : factory.molds.find(
          (m) =>
            resolveMoldTemplate(company, m.templateId).familyId === contract.familyId &&
            !factory.presses.some((p) => p.id !== press.id && p.moldId === m.id),
        );
    if (!chosenMold) continue;
    const moldId = chosenMold.id;

    const moldTemplate = resolveMoldTemplate(company, chosenMold.templateId);
    const materialId =
      press.materialId && moldTemplate.compatibleMaterialIds.includes(press.materialId)
        ? press.materialId
        : moldTemplate.compatibleMaterialIds.find((id) => (factory.materialStockKg[id] ?? 0) > 0) ?? moldTemplate.compatibleMaterialIds[0];
    if (!materialId) continue;

    const operatorId =
      press.operatorId ?? factory.employees.find((e) => e.role === 'operator' && !factory.presses.some((p) => p.operatorId === e.id))?.id ?? null;

    return { contract, moldId, materialId, operatorId };
  }
  return null;
}

function isBadlyTuned(press: Press): boolean {
  const material = getMaterial(press.materialId!);
  const p = press.params;
  return (
    deviationSeverity(p.meltTemp, material.meltTemp) > TUNE_SEVERITY_THRESHOLD ||
    deviationSeverity(p.moldTemp, material.moldTemp) > TUNE_SEVERITY_THRESHOLD ||
    deviationSeverity(p.injectionPressure, material.injectionPressure) > TUNE_SEVERITY_THRESHOLD ||
    deviationSeverity(p.injectionSpeed, material.injectionSpeed) > TUNE_SEVERITY_THRESHOLD ||
    deviationSeverity(p.coolingTime, material.coolingTime) > TUNE_SEVERITY_THRESHOLD
  );
}

/** Nudges each drifted parameter toward the middle of the material's ideal
 * window. A skilled setter (skill near 1) corrects almost fully in one visit;
 * a green hire only partially closes the gap and may need to come back. */
function retuneTowardIdeal(press: Press, skill: number): void {
  const material = getMaterial(press.materialId!);
  const closure = 0.5 + skill * 0.5;
  press.params.meltTemp = moveToward(press.params.meltTemp, material.meltTemp, closure);
  press.params.moldTemp = moveToward(press.params.moldTemp, material.moldTemp, closure);
  press.params.injectionPressure = moveToward(press.params.injectionPressure, material.injectionPressure, closure);
  press.params.injectionSpeed = moveToward(press.params.injectionSpeed, material.injectionSpeed, closure);
  press.params.coolingTime = moveToward(press.params.coolingTime, material.coolingTime, closure);
}

function moveToward(value: number, range: ProcessRange, closure: number): number {
  const mid = (range.idealMin + range.idealMax) / 2;
  return value + (mid - value) * closure;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
