import type { Company, Loan } from '../entities/company';
import type { Factory } from '../entities/factory';
import { pushEvent } from '../entities/factory';
import { isComplete } from '../entities/contract';
import { getPressTemplate } from '../../data/presses';
import { getMoldTemplate } from '../../data/molds';

/** Settles contracts that are finished or past their deadline. Runs every tick
 * so deliveries/failures happen as soon as they occur, not just at day end. */
export function settleContracts(company: Company, factory: Factory, simTimeMs: number): void {
  const stillActive: typeof factory.activeContracts = [];
  for (const contract of factory.activeContracts) {
    const overdue = simTimeMs > contract.deadlineMs;
    if (isComplete(contract) || overdue) {
      const totalMade = contract.producedGood + contract.producedReject;
      const qualityRatio = totalMade > 0 ? contract.producedGood / totalMade : 0;
      const deliverable = Math.min(contract.producedGood, contract.quantity);
      const missing = Math.max(0, contract.quantity - deliverable);
      const meetsQuality = qualityRatio >= contract.minQualityRatio || totalMade === 0;

      if (deliverable > 0 && (isComplete(contract) || deliverable >= contract.quantity * 0.5)) {
        const revenue = deliverable * contract.pricePerUnit - missing * contract.penaltyPerMissingUnit;
        company.cash += revenue;
        company.dayRevenueAccumulator += revenue;
        company.reputation = clamp01(company.reputation + (meetsQuality && missing === 0 ? 0.02 : -0.01));
        pushEvent(
          factory,
          simTimeMs,
          missing === 0 && meetsQuality ? 'contract_delivered' : 'contract_failed',
          `${contract.clientName}: ${deliverable}/${contract.quantity} livrées, ${round2(revenue)} en caisse.`,
        );
      } else {
        company.reputation = clamp01(company.reputation - 0.03);
        pushEvent(factory, simTimeMs, 'contract_failed', `${contract.clientName}: commande manquée, réputation entamée.`);
      }
      continue;
    }
    stillActive.push(contract);
  }
  factory.activeContracts = stillActive;
}

export function dailyFinanceUpdate(company: Company, factory: Factory, day: number): void {
  let expenses = 0;
  for (const emp of factory.employees) expenses += emp.wagePerDay;
  for (const press of factory.presses) expenses += getPressTemplate(press.templateId).upkeepPerDay;

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

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
