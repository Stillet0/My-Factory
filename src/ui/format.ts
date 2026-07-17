export function formatCurrency(v: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(v)) + ' €';
}

export function formatPercent(v: number): string {
  return `${Math.round(v * 100)}%`;
}

export function formatDay(day: number): string {
  return `Jour ${day + 1}`;
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
};

export const TOOLING_TIER_LABELS: Record<string, string> = {
  standard: 'Standard',
  precision: 'Précision',
};
