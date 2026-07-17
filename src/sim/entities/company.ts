import type { Factory } from './factory';
import type { MoldTemplate } from './mold';

export interface Loan {
  id: string;
  principal: number;
  remaining: number;
  dailyInterestRate: number;
  dailyPayment: number;
}

export interface FinanceHistoryDay {
  day: number;
  revenue: number;
  expenses: number;
  cashAtEnd: number;
}

export interface Company {
  cash: number;
  reputation: number; // 0..1
  factories: Factory[];
  loans: Loan[];
  history: FinanceHistoryDay[];
  /** Spot price multiplier per material id, random-walks around 1.0. */
  materialPriceMultipliers: Record<string, number>;
  /** Revenue collected since the last daily finance settlement, reset each day. */
  dayRevenueAccumulator: number;
  /** Mold blueprints the player has designed in the bureau d'étude (Phase 2). */
  customMoldTemplates: MoldTemplate[];
  /** Single active R&D slot — one research at a time. */
  researchInProgress: { techId: string; daysRemaining: number } | null;
  researchedTechIds: string[];
}

export function createCompany(): Company {
  return {
    cash: 50000,
    reputation: 0.3,
    factories: [],
    loans: [],
    history: [],
    materialPriceMultipliers: {},
    dayRevenueAccumulator: 0,
    customMoldTemplates: [],
    researchInProgress: null,
    researchedTechIds: [],
  };
}
