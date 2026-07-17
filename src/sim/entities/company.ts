import type { Factory } from './factory';

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
  };
}
