import type { Company, Loan } from '../entities/company';
import type { Factory } from '../entities/factory';
import { getPressTemplate } from '../../data/presses';
import { getMoldTemplate } from '../../data/molds';
import type { MoldTemplate } from '../entities/mold';
import { nextCustomMoldTemplateId } from '../entities/mold';
import type { MoldFamily, ToolingTier } from '../../data/moldFamilies';
import { computeCustomMoldStats } from '../formulas/moldDesign';
import { getTechNode } from '../../data/techtree';

/** Cancels a standing contract: pulls it out of activeContracts and frees
 * any press that was working it, so the setter re-equips it for something
 * else. Free of charge — a contract is just a price agreement, not a
 * binding order, so there's nothing to pay out of. */
export function cancelContract(factory: Factory, contractId: string): { ok: boolean } {
  const idx = factory.activeContracts.findIndex((c) => c.id === contractId);
  if (idx === -1) return { ok: false };
  const [contract] = factory.activeContracts.splice(idx, 1);
  contract.status = 'cancelled';
  for (const press of factory.presses) {
    if (press.contractId === contract.id) press.contractId = null;
  }
  return { ok: true };
}

/** High-performance drives (press_efficiency_1) cut daily press upkeep. */
export function pressUpkeepMultFor(company: Company): number {
  return company.researchedTechIds.includes('press_efficiency_1') ? 0.85 : 1;
}

export function dailyFinanceUpdate(company: Company, factory: Factory, day: number): void {
  let expenses = 0;
  const upkeepMult = pressUpkeepMultFor(company);
  for (const emp of factory.employees) expenses += emp.wagePerDay;
  for (const press of factory.presses) expenses += getPressTemplate(press.templateId).upkeepPerDay * upkeepMult;

  for (const loan of company.loans) {
    if (loan.remaining <= 0) continue;
    const interest = loan.remaining * loan.dailyInterestRate;
    const payment = Math.min(loan.remaining + interest, loan.dailyPayment);
    loan.remaining = Math.max(0, loan.remaining + interest - payment);
    expenses += payment;
  }
  company.loans = company.loans.filter((l) => l.remaining > 0.01);

  company.cash -= expenses;
  company.history.push({ day, revenue: round2(company.dayRevenueAccumulator), expenses: round2(expenses), cashAtEnd: round2(company.cash) });
  if (company.history.length > 90) company.history.shift();
  company.dayRevenueAccumulator = 0;
}

export function purchasePress(company: Company, templateId: string): { ok: boolean; reason?: string } {
  const template = getPressTemplate(templateId);
  if (company.cash < template.costBase) return { ok: false, reason: 'Trésorerie insuffisante' };
  company.cash -= template.costBase;
  return { ok: true };
}

export function buildMold(company: Company, moldTemplateId: string): { ok: boolean; reason?: string } {
  const template = getMoldTemplate(moldTemplateId);
  if (company.cash < template.buildCostBase) return { ok: false, reason: 'Trésorerie insuffisante' };
  company.cash -= template.buildCostBase;
  return { ok: true };
}

export function buyMaterial(company: Company, factory: Factory, materialId: string, kg: number, costPerKgBase: number): { ok: boolean; reason?: string } {
  const mult = company.materialPriceMultipliers[materialId] ?? 1;
  const cost = kg * costPerKgBase * mult;
  if (company.cash < cost) return { ok: false, reason: 'Trésorerie insuffisante' };
  company.cash -= cost;
  factory.materialStockKg[materialId] = (factory.materialStockKg[materialId] ?? 0) + kg;
  return { ok: true };
}

export const AUTOMATION_UPGRADE_COST = 8000;

/** Deducts cash and creates the mold *blueprint* immediately — the physical
 * mold itself is queued by the caller (see sim/systems/moldSystem.ts) and only
 * materializes once its build time elapses. */
export function designMold(
  company: Company,
  family: MoldFamily,
  cavities: number,
  tier: ToolingTier,
  materialIds: string[],
): { ok: boolean; reason?: string; template?: MoldTemplate } {
  if (!family.allowedCavities.includes(cavities)) {
    return { ok: false, reason: 'Nombre d’empreintes non disponible pour cette famille' };
  }
  const chosenMaterials = materialIds.filter((id) => family.compatibleMaterialIds.includes(id));
  if (chosenMaterials.length === 0) {
    return { ok: false, reason: 'Sélectionnez au moins une matière compatible' };
  }
  const stats = computeCustomMoldStats(family, cavities, tier);
  if (company.cash < stats.buildCostBase) return { ok: false, reason: 'Trésorerie insuffisante' };
  company.cash -= stats.buildCostBase;

  const template: MoldTemplate = {
    id: nextCustomMoldTemplateId(),
    familyId: family.id,
    partName: `${family.partName} (design ${tier === 'precision' ? 'précision' : 'standard'}, ${cavities} emp.)`,
    compatibleMaterialIds: chosenMaterials,
    cavities,
    partVolumeCm3: family.partVolumeCm3,
    projectedAreaCm2: family.projectedAreaCm2,
    complexityFactor: stats.complexityFactor,
    wearRateMult: stats.wearRateMult,
    buildCostBase: stats.buildCostBase,
    buildTimeDaysBase: stats.buildTimeDaysBase,
    sellPricePerUnitBase: family.sellPricePerUnitBase,
  };
  company.customMoldTemplates.push(template);
  return { ok: true, template };
}

export function startResearch(company: Company, techId: string): { ok: boolean; reason?: string } {
  const node = getTechNode(techId);
  if (company.researchedTechIds.includes(techId)) return { ok: false, reason: 'Déjà recherché' };
  if (company.researchInProgress) return { ok: false, reason: 'Une recherche est déjà en cours' };
  const missingPrereq = node.prerequisiteIds.find((id) => !company.researchedTechIds.includes(id));
  if (missingPrereq) return { ok: false, reason: 'Prérequis manquant' };
  if (company.cash < node.cost) return { ok: false, reason: 'Trésorerie insuffisante' };
  company.cash -= node.cost;
  company.researchInProgress = { techId, daysRemaining: node.researchDays };
  return { ok: true };
}

export const BASE_NEW_FACTORY_COST = 80000;
export const TRANSIT_DAYS = 2;
export const MATERIAL_TRANSFER_COST_PER_KG = 0.4;
export const MOLD_TRANSFER_COST = 2000;

/** Founding cost rises with each factory already owned — reflects a growing
 * company having more capital tied up and pricier real estate/permits. */
export function foundFactoryCost(company: Company): number {
  return Math.round(BASE_NEW_FACTORY_COST * Math.pow(1.6, company.factories.length - 1));
}

export function foundFactory(company: Company): { ok: boolean; reason?: string } {
  const cost = foundFactoryCost(company);
  if (company.cash < cost) return { ok: false, reason: 'Trésorerie insuffisante' };
  company.cash -= cost;
  return { ok: true };
}

export function transferMaterialCost(kg: number): number {
  return Math.round(kg * MATERIAL_TRANSFER_COST_PER_KG * 100) / 100;
}

export function chargeMaterialTransfer(company: Company, kg: number): { ok: boolean; reason?: string } {
  const cost = transferMaterialCost(kg);
  if (company.cash < cost) return { ok: false, reason: 'Trésorerie insuffisante pour le transport' };
  company.cash -= cost;
  return { ok: true };
}

export function chargeMoldTransfer(company: Company): { ok: boolean; reason?: string } {
  if (company.cash < MOLD_TRANSFER_COST) return { ok: false, reason: 'Trésorerie insuffisante pour le transport' };
  company.cash -= MOLD_TRANSFER_COST;
  return { ok: true };
}

export function takeLoan(company: Company, amount: number): void {
  const loan: Loan = {
    id: `loan_${Date.now()}_${Math.round(Math.random() * 1000)}`,
    principal: amount,
    remaining: amount,
    dailyInterestRate: 0.0015,
    dailyPayment: Math.max(50, amount / 60),
  };
  company.cash += amount;
  company.loans.push(loan);
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
