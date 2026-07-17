import type { Factory } from '../entities/factory';
import { pushEvent } from '../entities/factory';
import { CLAMP_MS, EJECT_MS, type Press } from '../entities/press';
import { getPressTemplate } from '../../data/presses';
import { getMoldTemplate } from '../../data/molds';
import { getMaterial } from '../../data/materials';
import { requiredTonnage, type Mold } from '../entities/mold';
import { isOnShiftNow } from '../entities/employee';
import { computeQuality } from '../formulas/defects';
import { rollShotOutcome } from './qualitySystem';
import { applyCycleWear, rollBreakdown } from './maintenanceSystem';
import { isComplete } from '../entities/contract';

/** Advances every press in the factory by one fixed tick. */
export function tickProduction(factory: Factory, tickMs: number, simTimeMs: number, hourOfDay: number): void {
  for (const press of factory.presses) {
    if (press.state === 'fault') continue;
    if (press.state === 'idle') {
      tryStartCycle(factory, press, hourOfDay);
      continue;
    }
    press.stateTimeRemainingMs -= tickMs;
    if (press.stateTimeRemainingMs > 0) continue;
    advanceState(factory, press, simTimeMs);
  }
}

function tryStartCycle(factory: Factory, press: Press, hourOfDay: number): void {
  if (!press.moldId || !press.materialId || !press.operatorId || !press.contractId) return;
  const operator = factory.employees.find((e) => e.id === press.operatorId);
  if (!operator || !isOnShiftNow(operator.shift, hourOfDay)) return;
  const mold = factory.molds.find((m) => m.id === press.moldId);
  const contract = factory.activeContracts.find((c) => c.id === press.contractId);
  if (!mold || !contract || isComplete(contract)) return;
  const template = getMoldTemplate(mold.templateId);
  if (template.id !== contract.moldTemplateId) return;

  const shotVolumeCm3 = template.partVolumeCm3 * template.cavities;
  const material = getMaterial(press.materialId);
  const shotWeightKg = (shotVolumeCm3 * material.density) / 1000;
  const stock = factory.materialStockKg[press.materialId] ?? 0;
  if (stock < shotWeightKg) return;

  factory.materialStockKg[press.materialId] = stock - shotWeightKg;
  press.state = 'clamping';
  press.stateTimeRemainingMs = CLAMP_MS;
}

function advanceState(factory: Factory, press: Press, simTimeMs: number): void {
  const mold = factory.molds.find((m) => m.id === press.moldId);
  if (!mold) {
    press.state = 'idle';
    return;
  }
  const template = getMoldTemplate(mold.templateId);
  const pressTemplate = getPressTemplate(press.templateId);

  switch (press.state) {
    case 'clamping': {
      const shotVolumeCm3 = template.partVolumeCm3 * template.cavities;
      const effectiveRate = Math.max(1, Math.min(pressTemplate.maxInjectionRateCm3s, press.params.injectionSpeed * 0.6));
      press.state = 'injecting';
      press.stateTimeRemainingMs = (shotVolumeCm3 / effectiveRate) * 1000;
      break;
    }
    case 'injecting': {
      press.state = 'cooling';
      press.stateTimeRemainingMs = press.params.coolingTime * 1000 * template.complexityFactor;
      break;
    }
    case 'cooling': {
      press.state = 'ejecting';
      press.stateTimeRemainingMs = EJECT_MS;
      break;
    }
    case 'ejecting': {
      completeCycle(factory, press, mold, simTimeMs);
      press.state = 'idle';
      press.stateTimeRemainingMs = 0;
      break;
    }
  }
}

function completeCycle(factory: Factory, press: Press, mold: Mold, simTimeMs: number): void {
  const template = getMoldTemplate(mold.templateId);
  const material = getMaterial(press.materialId!);
  const pressTemplate = getPressTemplate(press.templateId);
  const clampMarginRatio = (pressTemplate.tonnage - requiredTonnage(template)) / pressTemplate.tonnage;

  const quality = computeQuality(press.params, material, mold.wear, clampMarginRatio);
  const outcome = rollShotOutcome(quality, template.cavities);

  press.cyclesRun++;
  press.totalGood += outcome.good;
  press.totalDefects += outcome.reject;

  const contract = factory.activeContracts.find((c) => c.id === press.contractId);
  if (contract) {
    contract.producedGood += outcome.good;
    contract.producedReject += outcome.reject;
  }

  applyCycleWear(press, mold, quality.rejectProbability);
  if (rollBreakdown(press)) {
    press.state = 'fault';
    press.faultReason = 'Panne mécanique — la presse nécessite une réparation.';
    pushEvent(factory, simTimeMs, 'breakdown', `${pressTemplate.name} en panne (usure élevée).`);
  }
}
