import type { Company } from '../sim/entities/company';
import type { SimClockState } from '../sim/clock';

const SAVE_KEY = 'plastique-tycoon-save-v1';

export interface SaveData {
  version: 1;
  clock: SimClockState;
  company: Company;
}

export function saveGame(clock: SimClockState, company: Company): void {
  const data: SaveData = { version: 1, clock, company };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function loadGame(): SaveData | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SaveData;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
