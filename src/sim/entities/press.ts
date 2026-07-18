export type PressState = 'idle' | 'clamping' | 'injecting' | 'cooling' | 'ejecting' | 'fault';

export interface PressTemplate {
  id: string;
  name: string;
  tonnage: number;
  costBase: number;
  /** Max injection rate, cm3/s — caps how fast a shot can be filled. */
  maxInjectionRateCm3s: number;
  energyKw: number;
  upkeepPerDay: number;
  /** If set, this template only appears for purchase once the tech is researched. */
  requiresTechId?: string;
}

export interface ProcessParams {
  meltTemp: number;
  moldTemp: number;
  injectionPressure: number;
  injectionSpeed: number;
  coolingTime: number;
}

export interface Press {
  id: string;
  templateId: string;
  state: PressState;
  /** ms remaining in the current state. */
  stateTimeRemainingMs: number;
  wear: number; // 0..1, 1 = needs immediate overhaul
  moldId: string | null;
  operatorId: string | null;
  contractId: string | null;
  materialId: string | null;
  params: ProcessParams;
  cyclesRun: number;
  totalDefects: number;
  totalGood: number;
  faultReason: string | null;
  /** Robotized presses skip the operator/shift gate (at a small quality tradeoff). */
  automated: boolean;
  /** Good units boxed at the press but not yet delivered — a forklift must
   * ship them before they count toward the contract's producedGood. */
  pendingGoodUnits: number;
}

export function defaultParamsFor(): ProcessParams {
  return { meltTemp: 220, moldTemp: 40, injectionPressure: 800, injectionSpeed: 60, coolingTime: 10 };
}

export function createPress(id: string, templateId: string): Press {
  return {
    id,
    templateId,
    state: 'idle',
    stateTimeRemainingMs: 0,
    wear: 0,
    moldId: null,
    operatorId: null,
    contractId: null,
    materialId: null,
    params: defaultParamsFor(),
    cyclesRun: 0,
    totalDefects: 0,
    totalGood: 0,
    faultReason: null,
    automated: false,
    pendingGoodUnits: 0,
  };
}

export const CLAMP_MS = 1200;
export const EJECT_MS = 800;
