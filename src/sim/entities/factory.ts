import type { Press } from './press';
import type { Mold } from './mold';
import type { Employee } from './employee';
import type { Contract } from './contract';

export interface FactoryEvent {
  id: string;
  atMs: number;
  kind: 'breakdown' | 'contract_won' | 'contract_delivered' | 'contract_failed' | 'quit' | 'hired' | 'info' | 'contract_lost';
  message: string;
}

export interface MoldInProgress {
  id: string;
  templateId: string;
  readyOnDay: number;
}

export interface Factory {
  id: string;
  name: string;
  presses: Press[];
  molds: Mold[];
  moldsInProgress: MoldInProgress[];
  employees: Employee[];
  /** Raw material stock in kg, keyed by material id. */
  materialStockKg: Record<string, number>;
  activeContracts: Contract[];
  availableContracts: Contract[];
  events: FactoryEvent[];
}

let eventSeq = 0;
export function pushEvent(factory: Factory, atMs: number, kind: FactoryEvent['kind'], message: string): void {
  eventSeq++;
  factory.events.unshift({ id: `ev_${eventSeq}`, atMs, kind, message });
  if (factory.events.length > 200) factory.events.length = 200;
}

export function createFactory(id: string, name: string): Factory {
  return {
    id,
    name,
    presses: [],
    molds: [],
    moldsInProgress: [],
    employees: [],
    materialStockKg: {},
    activeContracts: [],
    availableContracts: [],
    events: [],
  };
}
