export function formatCurrency(v: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(v)) + ' €';
}

/** For small unit prices (€/pièce) — formatCurrency's 0-decimal rounding
 * would show most of them as "0 €". */
export function formatUnitPrice(v: number): string {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) + ' €';
}

export function formatPercent(v: number): string {
  return `${Math.round(v * 100)}%`;
}

export function formatDay(day: number): string {
  return `Jour ${day + 1}`;
}

/** Formats the time-of-day (HH:MM) from simulated ms elapsed, given the day length in ms. */
export function formatTimeOfDay(simTimeMs: number, dayLengthMs: number): string {
  const msIntoDay = simTimeMs % dayLengthMs;
  const totalMinutes = Math.floor((msIntoDay / dayLengthMs) * 24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export const PRESS_STATE_LABELS: Record<string, string> = {
  idle: 'À l’arrêt',
  clamping: 'Fermeture moule',
  injecting: 'Injection',
  cooling: 'Refroidissement',
  ejecting: 'Éjection',
  fault: 'En panne',
};

export const ROLE_LABELS: Record<string, string> = {
  operator: 'Opérateur',
  setter: 'Régleur',
  forklift: 'Cariste',
};

export const SHIFT_LABELS: Record<string, string> = {
  morning: 'Matin (6h-14h)',
  evening: 'Après-midi (14h-22h)',
  night: 'Nuit (22h-6h)',
};

export const TECH_CATEGORY_LABELS: Record<string, string> = {
  presses: 'Presses',
  automation: 'Automatisation',
  materials: 'Matières',
  quality: 'Qualité',
  molds: 'Moules',
};

export const TOOLING_TIER_LABELS: Record<string, string> = {
  standard: 'Standard',
  precision: 'Précision',
};

export const MATERIAL_FAMILY_LABELS: Record<string, string> = {
  thermoplastic: 'Thermoplastique',
  thermoset: 'Thermodurcissable',
};
